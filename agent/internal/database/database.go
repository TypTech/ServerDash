package database

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/serverdash/agent/internal/models"

	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/joho/godotenv"
)

// InitDB initializes the database connection
func InitDB() (*sql.DB, error) {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		fmt.Println("No env vars found")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		return nil, fmt.Errorf("database connection failed: %v", err)
	}

	return db, nil
}

// GetApplications fetches all applications with public URLs
func GetApplications(db *sql.DB) ([]models.Application, error) {
	rows, err := db.Query(
		`SELECT id, name, "publicURL", online, "uptimecheckUrl" FROM application WHERE "publicURL" IS NOT NULL`,
	)
	if err != nil {
		return nil, fmt.Errorf("error fetching applications: %v", err)
	}
	defer rows.Close()

	var apps []models.Application
	for rows.Next() {
		var app models.Application
		if err := rows.Scan(&app.ID, &app.Name, &app.PublicURL, &app.Online, &app.UptimeCheckURL); err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}
		apps = append(apps, app)
	}
	return apps, nil
}

// GetServers fetches all servers with monitoring enabled
func GetServers(db *sql.DB) ([]models.Server, error) {
	rows, err := db.Query(
		`SELECT id, name, monitoring, "monitoringURL", online, "cpuUsage", "ramUsage", "diskUsage" 
         FROM server WHERE monitoring = true`,
	)
	if err != nil {
		return nil, fmt.Errorf("error fetching servers: %v", err)
	}
	defer rows.Close()

	var servers []models.Server
	for rows.Next() {
		var server models.Server
		if err := rows.Scan(
			&server.ID, &server.Name, &server.Monitoring, &server.MonitoringURL,
			&server.Online, &server.CpuUsage, &server.RamUsage, &server.DiskUsage,
		); err != nil {
			fmt.Printf("Error scanning server row: %v\n", err)
			continue
		}
		servers = append(servers, server)
	}
	return servers, nil
}

// GetNetworkDevices fetches all network devices with monitoring enabled
func GetNetworkDevices(db *sql.DB) ([]models.NetworkDevice, error) {
	rows, err := db.Query(
		`SELECT id, name, type, ip, "monitoringURL", monitoring, online 
         FROM network_device WHERE monitoring = true`,
	)
	if err != nil {
		return nil, fmt.Errorf("error fetching network devices: %v", err)
	}
	defer rows.Close()

	var devices []models.NetworkDevice
	for rows.Next() {
		var device models.NetworkDevice
		if err := rows.Scan(
			&device.ID, &device.Name, &device.Type, &device.IP, &device.MonitoringURL,
			&device.Monitoring, &device.Online,
		); err != nil {
			fmt.Printf("Error scanning network device row: %v\n", err)
			continue
		}
		devices = append(devices, device)
	}
	return devices, nil
}

// LoadNotifications loads all enabled notifications
func LoadNotifications(db *sql.DB) ([]models.Notification, error) {
	rows, err := db.Query(
		`SELECT id, enabled, type, "smtpHost", "smtpPort", "smtpFrom", "smtpUser", "smtpPass", "smtpSecure", "smtpTo",
		       "telegramChatId", "telegramToken", "discordWebhook", "gotifyUrl", "gotifyToken", "ntfyUrl", "ntfyToken",
			   "pushoverUrl", "pushoverToken", "pushoverUser", "echobellURL"
		FROM notification
		WHERE enabled = true`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []models.Notification
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(
			&n.ID, &n.Enabled, &n.Type,
			&n.SMTPHost, &n.SMTPPort, &n.SMTPFrom, &n.SMTPUser, &n.SMTPPass, &n.SMTPSecure, &n.SMTPTo,
			&n.TelegramChatID, &n.TelegramToken, &n.DiscordWebhook,
			&n.GotifyUrl, &n.GotifyToken, &n.NtfyUrl, &n.NtfyToken,
			&n.PushoverUrl, &n.PushoverToken, &n.PushoverUser, &n.EchobellURL,
		); err != nil {
			fmt.Printf("Error scanning notification: %v\n", err)
			continue
		}
		configs = append(configs, n)
	}
	return configs, nil
}

// DeleteOldEntries removes entries older than 30 days
func DeleteOldEntries(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Delete old uptime history entries
	res, err := db.ExecContext(ctx,
		`DELETE FROM uptime_history WHERE "createdAt" < now() - interval '30 days'`,
	)
	if err != nil {
		return err
	}
	affected, _ := res.RowsAffected()
	fmt.Printf("Deleted %d old entries from uptime_history\n", affected)

	// Delete old server history entries
	res, err = db.ExecContext(ctx,
		`DELETE FROM server_history WHERE "createdAt" < now() - interval '30 days'`,
	)
	if err != nil {
		return err
	}
	affected, _ = res.RowsAffected()
	fmt.Printf("Deleted %d old entries from server_history\n", affected)

	return nil
}

// UpdateServerStatus updates a server's status and metrics
func UpdateServerStatus(db *sql.DB, serverID int, online bool, cpuUsage, ramUsage, diskUsage float64, uptime string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx,
		`UPDATE server SET online = $1, "cpuUsage" = $2::float8, "ramUsage" = $3::float8, "diskUsage" = $4::float8, "uptime" = $5
		 WHERE id = $6`,
		online, cpuUsage, ramUsage, diskUsage, uptime, serverID,
	)
	return err
}

// CheckAndSendTestNotifications checks for and processes test notifications
func CheckAndSendTestNotifications(db *sql.DB, notifications []models.Notification, sendFunc func(models.Notification, string)) {
	// Query for test notifications
	rows, err := db.Query(`SELECT tn.id, tn."notificationId" FROM test_notification tn`)
	if err != nil {
		fmt.Printf("Error fetching test notifications: %v\n", err)
		return
	}
	defer rows.Close()

	// Process each test notification
	var testIds []int
	for rows.Next() {
		var id, notificationId int
		if err := rows.Scan(&id, &notificationId); err != nil {
			fmt.Printf("Error scanning test notification: %v\n", err)
			continue
		}

		// Add to list of IDs to delete
		testIds = append(testIds, id)

		// Find the notification configuration
		for _, n := range notifications {
			if n.ID == notificationId {
				// Send test notification
				fmt.Printf("Sending test notification to notification ID %d\n", notificationId)
				sendFunc(n, "Test notification from ServerDash")
			}
		}
	}

	// Delete processed test notifications
	if len(testIds) > 0 {
		for _, id := range testIds {
			_, err := db.Exec(`DELETE FROM test_notification WHERE id = $1`, id)
			if err != nil {
				fmt.Printf("Error deleting test notification (ID: %d): %v\n", id, err)
			}
		}
	}
}
