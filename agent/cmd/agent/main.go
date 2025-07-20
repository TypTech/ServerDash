package main

import (
	"log"
	"time"

	"github.com/serverdash/agent/internal/app"
	"github.com/serverdash/agent/internal/database"
	"github.com/serverdash/agent/internal/notifications"
	"github.com/serverdash/agent/internal/server"
)

func main() {
	log.Println("Starting ServerDash Agent...")

	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	app := &app.App{
		DB:            db,
		Notifications: notifications.NewService(db),
	}

	monitor := server.NewMonitor(app)

	go func() {
		for {
			monitor.CheckServers()
			time.Sleep(30 * time.Second)
		}
	}()

	go func() {
		for {
			monitor.CheckApplications()
			time.Sleep(30 * time.Second)
		}
	}()

	log.Println("ServerDash Agent started successfully")

	select {}
}
