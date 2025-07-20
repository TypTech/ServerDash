package models

import (
	"database/sql"
)

type Application struct {
	ID             int
	Name           string
	PublicURL      string
	Online         bool
	UptimeCheckURL string
}

type Server struct {
	ID            int
	Name          string
	Monitoring    bool
	MonitoringURL sql.NullString
	Online        bool
	CpuUsage      sql.NullFloat64
	RamUsage      sql.NullFloat64
	DiskUsage     sql.NullFloat64
	GpuUsage      sql.NullFloat64
	Temp          sql.NullFloat64
	Uptime        sql.NullString
}

type CPUResponse struct {
	Total float64 `json:"total"`
}

type MemoryResponse struct {
	Active    int64   `json:"active"`
	Available int64   `json:"available"`
	Buffers   int64   `json:"buffers"`
	Cached    int64   `json:"cached"`
	Free      int64   `json:"free"`
	Inactive  int64   `json:"inactive"`
	Percent   float64 `json:"percent"`
	Shared    int64   `json:"shared"`
	Total     int64   `json:"total"`
	Used      int64   `json:"used"`
}

type FSResponse []struct {
	DeviceName string  `json:"device_name"`
	MntPoint   string  `json:"mnt_point"`
	Percent    float64 `json:"percent"`
}

type UptimeResponse struct {
	Value string `json:"value"`
}

type GPUResponse struct {
	Proc float64 `json:"proc"`
}

type TemperatureResponse struct {
	Composite []struct {
		Label    string  `json:"label"`
		Unit     string  `json:"unit"`
		Value    float64 `json:"value"`
		Warning  float64 `json:"warning"`
		Critical float64 `json:"critical"`
		Type     string  `json:"type"`
		Key      string  `json:"key"`
	} `json:"Composite"`
}

type TempResponse struct {
	Value float64 `json:"value"`
}

type Notification struct {
	ID             int
	Enabled        bool
	Type           string
	SMTPHost       sql.NullString
	SMTPPort       sql.NullInt64
	SMTPFrom       sql.NullString
	SMTPUser       sql.NullString
	SMTPPass       sql.NullString
	SMTPSecure     sql.NullBool
	SMTPTo         sql.NullString
	TelegramChatID sql.NullString
	TelegramToken  sql.NullString
	DiscordWebhook sql.NullString
	GotifyUrl      sql.NullString
	GotifyToken    sql.NullString
	NtfyUrl        sql.NullString
	NtfyToken      sql.NullString
	PushoverUrl    sql.NullString
	PushoverToken  sql.NullString
	PushoverUser   sql.NullString
	EchobellURL    sql.NullString
}
