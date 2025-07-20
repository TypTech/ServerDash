package notifications

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/corecontrol/agent/internal/models"

	"gopkg.in/gomail.v2"
)

type NotificationSender struct {
	notifications []models.Notification
	notifMutex    sync.RWMutex
}

// NewNotificationSender creates a new notification sender
func NewNotificationSender() *NotificationSender {
	return &NotificationSender{
		notifications: []models.Notification{},
		notifMutex:    sync.RWMutex{},
	}
}

// UpdateNotifications updates the stored notifications
func (ns *NotificationSender) UpdateNotifications(notifs []models.Notification) {
	ns.notifMutex.Lock()
	defer ns.notifMutex.Unlock()

	copyDst := make([]models.Notification, len(notifs))
	copy(copyDst, notifs)
	ns.notifications = copyDst
}

// GetNotifications returns a safe copy of current notifications
func (ns *NotificationSender) GetNotifications() []models.Notification {
	ns.notifMutex.RLock()
	defer ns.notifMutex.RUnlock()

	copyDst := make([]models.Notification, len(ns.notifications))
	copy(copyDst, ns.notifications)
	return copyDst
}

// SendNotifications sends a message to all configured notifications
func (ns *NotificationSender) SendNotifications(message string) {
	notifs := ns.GetNotifications()

	for _, n := range notifs {
		ns.SendSpecificNotification(n, message)
	}
}

// SendSpecificNotification sends a message to a specific notification
func (ns *NotificationSender) SendSpecificNotification(n models.Notification, message string) {
	fmt.Println("Sending specific notification..." + n.Type)
	switch n.Type {
	case "smtp":
		if n.SMTPHost.Valid && n.SMTPTo.Valid {
			ns.sendEmail(n, message)
		}
	case "telegram":
		if n.TelegramToken.Valid && n.TelegramChatID.Valid {
			ns.sendTelegram(n, message)
		}
	case "discord":
		if n.DiscordWebhook.Valid {
			ns.sendDiscord(n, message)
		}
	case "gotify":
		if n.GotifyUrl.Valid && n.GotifyToken.Valid {
			ns.sendGotify(n, message)
		}
	case "ntfy":
		if n.NtfyUrl.Valid && n.NtfyToken.Valid {
			ns.sendNtfy(n, message)
		}
	case "pushover":
		if n.PushoverUrl.Valid && n.PushoverToken.Valid && n.PushoverUser.Valid {
			ns.sendPushover(n, message)
		}
	case "echobell":
		if n.EchobellURL.Valid {
			ns.sendEchobell(n, message)
		}
	}
}

// Helper function to check if a host is an IP address
func (ns *NotificationSender) isIPAddress(host string) bool {
	ip := net.ParseIP(host)
	return ip != nil
}

// Individual notification methods
func (ns *NotificationSender) sendEmail(n models.Notification, body string) {
	// Initialize SMTP dialer with host, port, user, pass
	d := gomail.NewDialer(
		n.SMTPHost.String,
		int(n.SMTPPort.Int64),
		n.SMTPUser.String,
		n.SMTPPass.String,
	)
	if n.SMTPSecure.Valid && n.SMTPSecure.Bool {
		d.SSL = true
	}

	m := gomail.NewMessage()
	m.SetHeader("From", n.SMTPFrom.String)
	m.SetHeader("To", n.SMTPTo.String)
	m.SetHeader("Subject", "Uptime Notification")
	m.SetBody("text/plain", body)

	if err := d.DialAndSend(m); err != nil {
		fmt.Printf("Email send failed: %v\n", err)
	}
}

func (ns *NotificationSender) sendTelegram(n models.Notification, message string) {
	apiUrl := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage?chat_id=%s&text=%s",
		n.TelegramToken.String,
		n.TelegramChatID.String,
		message,
	)
	resp, err := http.Get(apiUrl)
	if err != nil {
		fmt.Printf("Telegram send failed: %v\n", err)
		return
	}
	resp.Body.Close()
}

func (ns *NotificationSender) sendDiscord(n models.Notification, message string) {
	payload := fmt.Sprintf(`{"content": "%s"}`, message)
	req, err := http.NewRequest("POST", n.DiscordWebhook.String, strings.NewReader(payload))
	if err != nil {
		fmt.Printf("Discord request creation failed: %v\n", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Discord send failed: %v\n", err)
		return
	}
	resp.Body.Close()
}

func (ns *NotificationSender) sendGotify(n models.Notification, message string) {
	baseURL := strings.TrimSuffix(n.GotifyUrl.String, "/")
	targetURL := fmt.Sprintf("%s/message", baseURL)

	form := url.Values{}
	form.Add("message", message)
	form.Add("priority", "5")

	req, err := http.NewRequest("POST", targetURL, strings.NewReader(form.Encode()))
	if err != nil {
		fmt.Printf("Gotify: ERROR creating request: %v\n", err)
		return
	}

	req.Header.Set("X-Gotify-Key", n.GotifyToken.String)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Gotify: ERROR sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Gotify: ERROR status code: %d\n", resp.StatusCode)
	}
}

func (ns *NotificationSender) sendNtfy(n models.Notification, message string) {
	fmt.Println("Sending Ntfy notification...")
	baseURL := strings.TrimSuffix(n.NtfyUrl.String, "/")

	// Don't append a topic to the URL - the URL itself should have the correct endpoint
	requestURL := baseURL

	// Send message directly as request body instead of JSON
	req, err := http.NewRequest("POST", requestURL, strings.NewReader(message))
	if err != nil {
		fmt.Printf("Ntfy: ERROR creating request: %v\n", err)
		return
	}

	if n.NtfyToken.Valid {
		req.Header.Set("Authorization", "Bearer "+n.NtfyToken.String)
	}
	// Use text/plain instead of application/json
	req.Header.Set("Content-Type", "text/plain")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Ntfy: ERROR sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Ntfy: ERROR status code: %d\n", resp.StatusCode)
	}
}

func (ns *NotificationSender) sendPushover(n models.Notification, message string) {
	form := url.Values{}
	form.Add("token", n.PushoverToken.String)
	form.Add("user", n.PushoverUser.String)
	form.Add("message", message)

	req, err := http.NewRequest("POST", n.PushoverUrl.String, strings.NewReader(form.Encode()))
	if err != nil {
		fmt.Printf("Pushover: ERROR creating request: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Pushover: ERROR sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Pushover: ERROR status code: %d\n", resp.StatusCode)
	}
}

func (ns *NotificationSender) sendEchobell(n models.Notification, message string) {
	jsonData := fmt.Sprintf(`{"message": "%s"}`, message)
	req, err := http.NewRequest("POST", n.EchobellURL.String, strings.NewReader(jsonData))
	if err != nil {
		fmt.Printf("Echobell: ERROR creating request: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Echobell: ERROR sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Echobell: ERROR status code: %d\n", resp.StatusCode)
	}
}
