package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/serverdash/agent/internal/models"
	"github.com/serverdash/agent/internal/notifications"
)

// notificationState tracks the last known status for each server
var notificationState = struct {
	sync.RWMutex
	lastStatus map[int]bool
}{
	lastStatus: make(map[int]bool),
}

// MonitorServers checks and updates the status of all servers
func MonitorServers(db *sql.DB, client *http.Client, servers []models.Server, notifSender *notifications.NotificationSender) {
	var notificationTemplate string
	err := db.QueryRow("SELECT notification_text_server FROM settings LIMIT 1").Scan(&notificationTemplate)
	if err != nil || notificationTemplate == "" {
		notificationTemplate = "The server !name is now !status!"
	}

	for _, server := range servers {
		if !server.Monitoring || !server.MonitoringURL.Valid {
			continue
		}

		logPrefix := fmt.Sprintf("[Server %s]", server.Name)
		fmt.Printf("%s Checking...\n", logPrefix)

		baseURL := strings.TrimSuffix(server.MonitoringURL.String, "/")
		var cpuUsage, ramUsage, diskUsage, gpuUsage, temp float64
		var online = true
		var uptimeStr string

		// Get CPU usage
		online, cpuUsage = fetchCPUUsage(client, baseURL, logPrefix)
		if !online {
			updateServerStatus(db, server.ID, false, 0, 0, 0, 0, 0, "")
			if shouldSendNotification(server.ID, online) {
				sendStatusChangeNotification(server, online, notificationTemplate, notifSender)
			}
			addServerHistoryEntry(db, server.ID, false, 0, 0, 0, 0, 0)
			continue
		}

		// Get uptime if server is online
		uptimeStr = fetchUptime(client, baseURL, logPrefix)

		// Get Memory usage
		memOnline, memUsage := fetchMemoryUsage(client, baseURL, logPrefix)
		if !memOnline {
			online = false
			updateServerStatus(db, server.ID, false, 0, 0, 0, 0, 0, "")
			if shouldSendNotification(server.ID, online) {
				sendStatusChangeNotification(server, online, notificationTemplate, notifSender)
			}
			addServerHistoryEntry(db, server.ID, false, 0, 0, 0, 0, 0)
			continue
		}
		ramUsage = memUsage

		// Get Disk usage
		diskOnline, diskUsageVal := fetchDiskUsage(client, baseURL, logPrefix)
		if !diskOnline {
			online = false
			updateServerStatus(db, server.ID, false, 0, 0, 0, 0, 0, "")
			if shouldSendNotification(server.ID, online) {
				sendStatusChangeNotification(server, online, notificationTemplate, notifSender)
			}
			addServerHistoryEntry(db, server.ID, false, 0, 0, 0, 0, 0)
			continue
		}
		diskUsage = diskUsageVal

		// Get GPU usage
		_, gpuUsageVal := fetchGPUUsage(client, baseURL, logPrefix)
		gpuUsage = gpuUsageVal

		// Get Temperature
		_, tempVal := fetchTemperature(client, baseURL, logPrefix)
		temp = tempVal

		// Check if status changed and send notification if needed
		if online != server.Online && shouldSendNotification(server.ID, online) {
			sendStatusChangeNotification(server, online, notificationTemplate, notifSender)
		}

		// Update server status with metrics
		updateServerStatus(db, server.ID, online, cpuUsage, ramUsage, diskUsage, gpuUsage, temp, uptimeStr)

		// Add entry to server history
		addServerHistoryEntry(db, server.ID, online, cpuUsage, ramUsage, diskUsage, gpuUsage, temp)

		fmt.Printf("%s Updated - CPU: %.2f%%, RAM: %.2f%%, Disk: %.2f%%, GPU: %.2f%%, Temp: %.2f°C, Uptime: %s\n",
			logPrefix, cpuUsage, ramUsage, diskUsage, gpuUsage, temp, uptimeStr)
	}
}

// shouldSendNotification checks if a notification should be sent based on status change
func shouldSendNotification(serverID int, online bool) bool {
	notificationState.Lock()
	defer notificationState.Unlock()

	lastStatus, exists := notificationState.lastStatus[serverID]

	// If this is the first check or status has changed
	if !exists || lastStatus != online {
		notificationState.lastStatus[serverID] = online
		return true
	}

	return false
}

// Helper function to fetch CPU usage
func fetchCPUUsage(client *http.Client, baseURL, logPrefix string) (bool, float64) {
	cpuResp, err := client.Get(fmt.Sprintf("%s/api/4/cpu", baseURL))
	if err != nil {
		fmt.Printf("%s CPU request failed: %v\n", logPrefix, err)
		return false, 0
	}
	defer cpuResp.Body.Close()

	if cpuResp.StatusCode != http.StatusOK {
		fmt.Printf("%s Bad CPU status code: %d\n", logPrefix, cpuResp.StatusCode)
		return false, 0
	}

	var cpuData models.CPUResponse
	if err := json.NewDecoder(cpuResp.Body).Decode(&cpuData); err != nil {
		fmt.Printf("%s Failed to parse CPU JSON: %v\n", logPrefix, err)
		return false, 0
	}

	return true, cpuData.Total
}

// Helper function to fetch memory usage
func fetchMemoryUsage(client *http.Client, baseURL, logPrefix string) (bool, float64) {
	memResp, err := client.Get(fmt.Sprintf("%s/api/4/mem", baseURL))
	if err != nil {
		fmt.Printf("%s Memory request failed: %v\n", logPrefix, err)
		return false, 0
	}
	defer memResp.Body.Close()

	if memResp.StatusCode != http.StatusOK {
		fmt.Printf("%s Bad memory status code: %d\n", logPrefix, memResp.StatusCode)
		return false, 0
	}

	var memData models.MemoryResponse
	if err := json.NewDecoder(memResp.Body).Decode(&memData); err != nil {
		fmt.Printf("%s Failed to parse memory JSON: %v\n", logPrefix, err)
		return false, 0
	}

	return true, memData.Percent
}

// Helper function to fetch disk usage
func fetchDiskUsage(client *http.Client, baseURL, logPrefix string) (bool, float64) {
	fsResp, err := client.Get(fmt.Sprintf("%s/api/4/fs", baseURL))
	if err != nil {
		fmt.Printf("%s Filesystem request failed: %v\n", logPrefix, err)
		return false, 0
	}
	defer fsResp.Body.Close()

	if fsResp.StatusCode != http.StatusOK {
		fmt.Printf("%s Bad filesystem status code: %d\n", logPrefix, fsResp.StatusCode)
		return false, 0
	}

	var fsData models.FSResponse
	if err := json.NewDecoder(fsResp.Body).Decode(&fsData); err != nil {
		fmt.Printf("%s Failed to parse filesystem JSON: %v\n", logPrefix, err)
		return false, 0
	}

	if len(fsData) > 0 {
		return true, fsData[0].Percent
	}

	return true, 0
}

// Helper function to fetch uptime
func fetchUptime(client *http.Client, baseURL, logPrefix string) string {
	uptimeResp, err := client.Get(fmt.Sprintf("%s/api/4/uptime", baseURL))
	if err != nil || uptimeResp.StatusCode != http.StatusOK {
		if err != nil {
			fmt.Printf("%s Uptime request failed: %v\n", logPrefix, err)
		} else {
			fmt.Printf("%s Bad uptime status code: %d\n", logPrefix, uptimeResp.StatusCode)
			uptimeResp.Body.Close()
		}
		return ""
	}
	defer uptimeResp.Body.Close()

	// Read the response body as a string first
	uptimeBytes, err := io.ReadAll(uptimeResp.Body)
	if err != nil {
		fmt.Printf("%s Failed to read uptime response: %v\n", logPrefix, err)
		return ""
	}

	uptimeStr := strings.Trim(string(uptimeBytes), "\"")

	// Try to parse as JSON object first, then fallback to direct string if that fails
	var uptimeData models.UptimeResponse
	if jsonErr := json.Unmarshal(uptimeBytes, &uptimeData); jsonErr == nil && uptimeData.Value != "" {
		uptimeStr = formatUptime(uptimeData.Value)
	} else {
		// Use the string directly
		uptimeStr = formatUptime(uptimeStr)
	}

	fmt.Printf("%s Uptime: %s (formatted: %s)\n", logPrefix, string(uptimeBytes), uptimeStr)
	return uptimeStr
}

// Helper function to fetch GPU usage
func fetchGPUUsage(client *http.Client, baseURL, logPrefix string) (bool, float64) {
	gpuResp, err := client.Get(fmt.Sprintf("%s/api/4/gpu", baseURL))
	if err != nil {
		fmt.Printf("%s GPU request failed: %v\n", logPrefix, err)
		return true, 0 // Return true to indicate server is still online
	}
	defer gpuResp.Body.Close()

	if gpuResp.StatusCode != http.StatusOK {
		fmt.Printf("%s Bad GPU status code: %d\n", logPrefix, gpuResp.StatusCode)
		return true, 0 // Return true to indicate server is still online
	}

	var gpuData models.GPUResponse
	if err := json.NewDecoder(gpuResp.Body).Decode(&gpuData); err != nil {
		fmt.Printf("%s Failed to parse GPU JSON: %v\n", logPrefix, err)
		return true, 0 // Return true to indicate server is still online
	}

	return true, gpuData.Proc
}

// Helper function to fetch temperature
func fetchTemperature(client *http.Client, baseURL, logPrefix string) (bool, float64) {
	tempResp, err := client.Get(fmt.Sprintf("%s/api/4/sensors/label/value/Composite", baseURL))
	if err != nil {
		fmt.Printf("%s Temperature request failed: %v\n", logPrefix, err)
		return true, 0 // Return true to indicate server is still online
	}
	defer tempResp.Body.Close()

	if tempResp.StatusCode != http.StatusOK {
		fmt.Printf("%s Bad temperature status code: %d\n", logPrefix, tempResp.StatusCode)
		return true, 0 // Return true to indicate server is still online
	}

	var tempData models.TemperatureResponse
	if err := json.NewDecoder(tempResp.Body).Decode(&tempData); err != nil {
		fmt.Printf("%s Failed to parse temperature JSON: %v\n", logPrefix, err)
		return true, 0 // Return true to indicate server is still online
	}

	if len(tempData.Composite) > 0 {
		return true, tempData.Composite[0].Value
	}

	return true, 0
}

// Helper function to send notification about status change
func sendStatusChangeNotification(server models.Server, online bool, template string, notifSender *notifications.NotificationSender) {
	status := "offline"
	if online {
		status = "online"
	}

	message := strings.ReplaceAll(template, "!name", server.Name)
	message = strings.ReplaceAll(message, "!status", status)

	notifSender.SendNotifications(message)
}

// Helper function to update server status
func updateServerStatus(db *sql.DB, serverID int, online bool, cpuUsage, ramUsage, diskUsage, gpuUsage, temp float64, uptime string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx,
		`UPDATE server SET online = $1, "cpuUsage" = $2::float8, "ramUsage" = $3::float8, "diskUsage" = $4::float8, "gpuUsage" = $5::float8, "temp" = $6::float8, "uptime" = $7
		 WHERE id = $8`,
		online, cpuUsage, ramUsage, diskUsage, gpuUsage, temp, uptime, serverID,
	)
	if err != nil {
		fmt.Printf("Failed to update server status (ID: %d): %v\n", serverID, err)
	}
}

// Helper function to add server history entry
func addServerHistoryEntry(db *sql.DB, serverID int, online bool, cpuUsage, ramUsage, diskUsage, gpuUsage, temp float64) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx,
		`INSERT INTO server_history(
			"serverId", online, "cpuUsage", "ramUsage", "diskUsage", "gpuUsage", "temp", "createdAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
		serverID, online, fmt.Sprintf("%.2f", cpuUsage), fmt.Sprintf("%.2f", ramUsage),
		fmt.Sprintf("%.2f", diskUsage), fmt.Sprintf("%.2f", gpuUsage), fmt.Sprintf("%.2f", temp),
	)
	if err != nil {
		fmt.Printf("Failed to insert server history (ID: %d): %v\n", serverID, err)
	}
}

// FormatUptime formats the uptime string to a standard format
func formatUptime(uptimeStr string) string {
	// Example input: "3 days, 3:52:36"
	// Target output: "28.6 13:52"

	now := time.Now()

	// Parse the uptime components
	parts := strings.Split(uptimeStr, ", ")

	var days int
	var timeStr string

	if len(parts) == 2 {
		// Has days part and time part
		_, err := fmt.Sscanf(parts[0], "%d days", &days)
		if err != nil {
			// Try singular "day"
			_, err = fmt.Sscanf(parts[0], "%d day", &days)
			if err != nil {
				return uptimeStr // Return original if parsing fails
			}
		}
		timeStr = parts[1]
	} else if len(parts) == 1 {
		// Only has time part (less than a day)
		days = 0
		timeStr = parts[0]
	} else {
		return uptimeStr // Return original if format is unexpected
	}

	// Parse the time component (hours:minutes:seconds)
	var hours, minutes, seconds int
	_, err := fmt.Sscanf(timeStr, "%d:%d:%d", &hours, &minutes, &seconds)
	if err != nil {
		return uptimeStr // Return original if parsing fails
	}

	// Calculate the total duration
	duration := time.Duration(days)*24*time.Hour +
		time.Duration(hours)*time.Hour +
		time.Duration(minutes)*time.Minute +
		time.Duration(seconds)*time.Second

	// Calculate the start time by subtracting the duration from now
	startTime := now.Add(-duration)

	// Format the result in the required format (day.month hour:minute)
	return startTime.Format("2.1 15:04")
}
