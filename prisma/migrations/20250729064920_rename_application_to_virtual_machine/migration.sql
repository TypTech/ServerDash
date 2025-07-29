/*
  Warnings:

  - You are about to drop the column `applicationId` on the `uptime_history` table. All the data in the column will be lost.
  - You are about to drop the `application` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "uptime_history" DROP COLUMN "applicationId",
ADD COLUMN     "virtualMachineId" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "application";

-- CreateTable
CREATE TABLE "virtual_machine" (
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

    CONSTRAINT "virtual_machine_pkey" PRIMARY KEY ("id")
);
