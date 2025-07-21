package network

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/serverdash/agent/internal/models"
	"github.com/serverdash/agent/internal/notifications"
)

// notificationState tracks the last known status for each network device
var notificationState = struct {
	sync.RWMutex
	lastStatus map[int]bool
}{
	lastStatus: make(map[int]bool),
}

// MonitorNetworkDevices checks and updates the status of all network devices
func MonitorNetworkDevices(db *sql.DB, client *http.Client, devices []models.NetworkDevice, notifSender *notifications.NotificationSender) {
	var notificationTemplate string
	err := db.QueryRow("SELECT notification_text_network_device FROM settings LIMIT 1").Scan(&notificationTemplate)
	if err != nil || notificationTemplate == "" {
		notificationTemplate = "The network device !name (!ip) is now !status!"
	}

	for _, device := range devices {
		logPrefix := fmt.Sprintf("[Network Device %s]", device.Name)
		fmt.Printf("%s Checking...\n", logPrefix)

		var online bool
		var responseTime float64
		var uptime string
		var bandwidth string

		// Use different monitoring approaches based on device type
		if device.MonitoringURL.Valid && device.MonitoringURL.String != "" {
			// If device has a monitoring URL (e.g., web interface), use HTTP check
			online, responseTime = checkHTTPStatus(client, device.MonitoringURL.String, logPrefix)
			uptime = "HTTP Check"
			bandwidth = "N/A"
		} else if device.IP.Valid && device.IP.String != "" {
			// Use ping for basic connectivity check
			online, responseTime = pingDevice(device.IP.String, logPrefix)
			uptime = "Ping Check"
			bandwidth = "N/A"
		} else {
			fmt.Printf("%s No IP or monitoring URL configured, skipping\n", logPrefix)
			continue
		}

		// Check if status changed and send notification if needed
		if online != device.Online && shouldSendNotification(device.ID, online) {
			sendStatusChangeNotification(device, online, notificationTemplate, notifSender)
		}

		// Update device status with metrics
		updateDeviceStatus(db, device.ID, online, responseTime, uptime, bandwidth)

		// Add entry to device history
		addDeviceHistoryEntry(db, device.ID, online, responseTime, bandwidth)

		status := "offline"
		if online {
			status = "online"
		}
		fmt.Printf("%s Updated - Status: %s, Response: %.2fms\n",
			logPrefix, status, responseTime)
	}
}

// shouldSendNotification checks if a notification should be sent based on status change
func shouldSendNotification(deviceID int, online bool) bool {
	notificationState.Lock()
	defer notificationState.Unlock()

	lastStatus, exists := notificationState.lastStatus[deviceID]

	// If this is the first check or status has changed
	if !exists || lastStatus != online {
		notificationState.lastStatus[deviceID] = online
		return true
	}

	return false
}

// checkHTTPStatus performs HTTP check for devices with web interfaces
func checkHTTPStatus(client *http.Client, monitoringURL, logPrefix string) (bool, float64) {
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", monitoringURL, nil)
	if err != nil {
		fmt.Printf("%s HTTP request creation failed: %v\n", logPrefix, err)
		return false, 0
	}

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("%s HTTP request failed: %v\n", logPrefix, err)
		return false, 0
	}
	defer resp.Body.Close()

	responseTime := float64(time.Since(start).Microseconds()) / 1000.0 // Convert to milliseconds

	// Consider HTTP status codes 200-399 as "online"
	online := resp.StatusCode >= 200 && resp.StatusCode < 400

	fmt.Printf("%s HTTP status: %d, response time: %.2fms\n", logPrefix, resp.StatusCode, responseTime)

	return online, responseTime
}

// pingDevice performs ping check for basic connectivity
func pingDevice(ip, logPrefix string) (bool, float64) {
	start := time.Now()

	// Use a simple TCP connection test as a ping alternative
	// This is more reliable in containerized environments
	conn, err := net.DialTimeout("tcp", ip+":80", 3*time.Second)
	if err != nil {
		// Try alternative common ports if port 80 fails
		ports := []string{"443", "22", "23", "161"} // HTTPS, SSH, Telnet, SNMP
		for _, port := range ports {
			conn, err = net.DialTimeout("tcp", ip+":"+port, 1*time.Second)
			if err == nil {
				conn.Close()
				break
			}
		}

		if err != nil {
			fmt.Printf("%s TCP connection failed: %v\n", logPrefix, err)
			return false, 0
		}
	}

	if conn != nil {
		conn.Close()
	}

	responseTime := float64(time.Since(start).Microseconds()) / 1000.0 // Convert to milliseconds

	fmt.Printf("%s TCP connection successful, response time: %.2fms\n", logPrefix, responseTime)

	return true, responseTime
}

// sendStatusChangeNotification sends notification about status change
func sendStatusChangeNotification(device models.NetworkDevice, online bool, template string, notifSender *notifications.NotificationSender) {
	status := "offline"
	if online {
		status = "online"
	}

	ip := "unknown"
	if device.IP.Valid {
		ip = device.IP.String
	}

	message := strings.ReplaceAll(template, "!name", device.Name)
	message = strings.ReplaceAll(message, "!ip", ip)
	message = strings.ReplaceAll(message, "!status", status)

	notifSender.SendNotifications(message)
}

// updateDeviceStatus updates network device status in database
func updateDeviceStatus(db *sql.DB, deviceID int, online bool, responseTime float64, uptime, bandwidth string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx,
		`UPDATE network_device SET online = $1, "responseTime" = $2::text, uptime = $3, bandwidth = $4, "lastChecked" = now()
		 WHERE id = $5`,
		online, fmt.Sprintf("%.2f", responseTime), uptime, bandwidth, deviceID,
	)
	if err != nil {
		fmt.Printf("Failed to update network device status (ID: %d): %v\n", deviceID, err)
	}
}

// addDeviceHistoryEntry adds network device history entry
func addDeviceHistoryEntry(db *sql.DB, deviceID int, online bool, responseTime float64, bandwidth string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx,
		`INSERT INTO network_device_history(
			"deviceId", online, "responseTime", bandwidth, "createdAt"
		) VALUES ($1, $2, $3, $4, now())`,
		deviceID, online, fmt.Sprintf("%.2f", responseTime), bandwidth,
	)
	if err != nil {
		fmt.Printf("Failed to insert network device history (ID: %d): %v\n", deviceID, err)
	}
}
