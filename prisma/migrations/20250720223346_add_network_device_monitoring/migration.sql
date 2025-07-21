-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "notification_text_network_device" TEXT;

-- CreateTable
CREATE TABLE "network_device" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "icon" TEXT,
    "ip" TEXT,
    "macAddress" TEXT,
    "location" TEXT,
    "description" TEXT,
    "portsCount" INTEGER,
    "wirelessStandard" TEXT,
    "frequency" TEXT,
    "powerConsumption" INTEGER,
    "firmwareVersion" TEXT,
    "managementURL" TEXT,
    "monitoring" BOOLEAN NOT NULL DEFAULT false,
    "monitoringURL" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "uptime" TEXT,
    "responseTime" TEXT,
    "lastChecked" TIMESTAMP(3),
    "packetLoss" TEXT,
    "bandwidth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_device_history" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL DEFAULT 1,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "responseTime" TEXT,
    "packetLoss" TEXT,
    "bandwidth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_device_history_pkey" PRIMARY KEY ("id")
);
