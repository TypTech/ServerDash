-- CreateTable
CREATE TABLE "application" (
    "id" SERIAL NOT NULL,
    "serverId" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "publicURL" TEXT NOT NULL,
    "localURL" TEXT,
    "uptimecheckUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "online" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uptime_history" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL DEFAULT 1,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uptime_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_history" (
    "id" SERIAL NOT NULL,
    "serverId" INTEGER NOT NULL DEFAULT 1,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "cpuUsage" TEXT,
    "ramUsage" TEXT,
    "diskUsage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server" (
    "id" SERIAL NOT NULL,
    "host" BOOLEAN NOT NULL DEFAULT false,
    "hostServer" INTEGER,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "os" TEXT,
    "ip" TEXT,
    "url" TEXT,
    "cpu" TEXT,
    "gpu" TEXT,
    "ram" TEXT,
    "disk" TEXT,
    "monitoring" BOOLEAN NOT NULL DEFAULT false,
    "monitoringURL" TEXT,
    "cpuUsage" TEXT,
    "ramUsage" TEXT,
    "diskUsage" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "uptime" TEXT,

    CONSTRAINT "server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "uptime_checks" BOOLEAN NOT NULL DEFAULT true,
    "notification_text_application" TEXT,
    "notification_text_server" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpFrom" TEXT,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpSecure" BOOLEAN,
    "smtpTo" TEXT,
    "telegramChatId" TEXT,
    "telegramToken" TEXT,
    "discordWebhook" TEXT,
    "gotifyUrl" TEXT,
    "gotifyToken" TEXT,
    "ntfyUrl" TEXT,
    "ntfyToken" TEXT,
    "pushoverUrl" TEXT,
    "pushoverToken" TEXT,
    "pushoverUser" TEXT,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_notification" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,

    CONSTRAINT "test_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
