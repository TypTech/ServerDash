package main

import (
	"log"
	"net/http"
	"time"

	"github.com/serverdash/agent/internal/app"
	"github.com/serverdash/agent/internal/database"
	"github.com/serverdash/agent/internal/models"
	"github.com/serverdash/agent/internal/network"
	"github.com/serverdash/agent/internal/notifications"
	"github.com/serverdash/agent/internal/server"
)

func main() {
	log.Println("Starting ServerDash Agent...")

	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	// Create HTTP client for monitoring
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Create notification sender
	notifSender := notifications.NewNotificationSender()

	// Load initial notifications
	notificationConfigs, err := database.LoadNotifications(db)
	if err != nil {
		log.Printf("Failed to load notifications: %v", err)
	} else {
		notifSender.UpdateNotifications(notificationConfigs)
	}

	// Start monitoring goroutines
	go func() {
		for {
			// Monitor applications
			apps, err := database.GetApplications(db)
			if err != nil {
				log.Printf("Failed to get applications: %v", err)
			} else {
				app.MonitorApplications(db, client, apps, notifSender)
			}

			time.Sleep(30 * time.Second)
		}
	}()

	go func() {
		for {
			// Monitor servers
			servers, err := database.GetServers(db)
			if err != nil {
				log.Printf("Failed to get servers: %v", err)
			} else {
				server.MonitorServers(db, client, servers, notifSender)
			}

			time.Sleep(30 * time.Second)
		}
	}()

	// Start network device monitoring goroutine
	go func() {
		for {
			// Monitor network devices
			devices, err := database.GetNetworkDevices(db)
			if err != nil {
				log.Printf("Failed to get network devices: %v", err)
			} else {
				network.MonitorNetworkDevices(db, client, devices, notifSender)
			}

			time.Sleep(30 * time.Second)
		}
	}()

	// Cleanup old entries periodically
	go func() {
		for {
			time.Sleep(24 * time.Hour) // Run once daily
			if err := database.DeleteOldEntries(db); err != nil {
				log.Printf("Failed to delete old entries: %v", err)
			}
		}
	}()

	// Check for test notifications periodically
	go func() {
		for {
			notificationConfigs, err := database.LoadNotifications(db)
			if err == nil {
				notifSender.UpdateNotifications(notificationConfigs)
				database.CheckAndSendTestNotifications(db, notificationConfigs, func(n models.Notification, message string) {
					notifSender.SendNotifications(message)
				})
			}
			time.Sleep(10 * time.Second)
		}
	}()

	log.Println("ServerDash Agent started successfully")

	select {}
}
