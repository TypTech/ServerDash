package app

import (
	"context"
	"crypto/x509"
	"database/sql"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/corecontrol/agent/internal/models"
	"github.com/corecontrol/agent/internal/notifications"
)

// MonitorApplications checks and updates the status of all applications
func MonitorApplications(db *sql.DB, client *http.Client, apps []models.Application, notifSender *notifications.NotificationSender) {
	var notificationTemplate string
	err := db.QueryRow("SELECT notification_text_application FROM settings LIMIT 1").Scan(&notificationTemplate)
	if err != nil || notificationTemplate == "" {
		notificationTemplate = "The application !name (!url) went !status!"
	}

	for _, app := range apps {
		logPrefix := fmt.Sprintf("[App %s (%s)]", app.Name, app.PublicURL)
		fmt.Printf("%s Checking...\n", logPrefix)

		// Determine which URL to use for monitoring
		checkURL := app.PublicURL
		if app.UptimeCheckURL != "" {
			checkURL = app.UptimeCheckURL
			fmt.Printf("%s Using custom uptime check URL: %s\n", logPrefix, checkURL)
		}

		parsedURL, parseErr := url.Parse(checkURL)
		if parseErr != nil {
			fmt.Printf("%s Invalid URL: %v\n", logPrefix, parseErr)
			continue
		}

		hostIsIP := isIPAddress(parsedURL.Hostname())
		var isOnline bool

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		req, err := http.NewRequestWithContext(ctx, "GET", checkURL, nil)
		if err != nil {
			fmt.Printf("%s Request creation failed: %v\n", logPrefix, err)
			continue
		}

		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			isOnline = resp.StatusCode >= 200 && resp.StatusCode < 400
			fmt.Printf("%s Response status: %d\n", logPrefix, resp.StatusCode)
		} else {
			fmt.Printf("%s Connection error: %v\n", logPrefix, err)

			if hostIsIP {
				var urlErr *url.Error
				if errors.As(err, &urlErr) {
					var certErr x509.HostnameError
					var unknownAuthErr x509.UnknownAuthorityError
					if errors.As(urlErr.Err, &certErr) || errors.As(urlErr.Err, &unknownAuthErr) {
						fmt.Printf("%s Ignoring TLS error for IP, marking as online\n", logPrefix)
						isOnline = true
					}
				}
			}
		}

		if isOnline != app.Online {
			status := "offline"
			if isOnline {
				status = "online"
			}

			message := strings.ReplaceAll(notificationTemplate, "!name", app.Name)
			message = strings.ReplaceAll(message, "!url", app.PublicURL)
			message = strings.ReplaceAll(message, "!status", status)

			notifSender.SendNotifications(message)
		}

		// Update application status in database
		updateApplicationStatus(db, app.ID, isOnline)

		// Add entry to uptime history
		addUptimeHistoryEntry(db, app.ID, isOnline)
	}
}

// Helper function to update application status
func updateApplicationStatus(db *sql.DB, appID int, online bool) {
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer dbCancel()

	_, err := db.ExecContext(dbCtx,
		`UPDATE application SET online = $1 WHERE id = $2`,
		online, appID,
	)
	if err != nil {
		fmt.Printf("DB update failed for app ID %d: %v\n", appID, err)
	}
}

// Helper function to add uptime history entry
func addUptimeHistoryEntry(db *sql.DB, appID int, online bool) {
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer dbCancel()

	_, err := db.ExecContext(dbCtx,
		`INSERT INTO uptime_history("applicationId", online, "createdAt") VALUES ($1, $2, now())`,
		appID, online,
	)
	if err != nil {
		fmt.Printf("History insert failed for app ID %d: %v\n", appID, err)
	}
}

// Helper function to check if a host is an IP address
func isIPAddress(host string) bool {
	ip := net.ParseIP(host)
	return ip != nil
}
