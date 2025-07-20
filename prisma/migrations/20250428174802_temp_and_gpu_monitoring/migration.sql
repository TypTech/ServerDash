-- AlterTable
ALTER TABLE "server" ADD COLUMN     "gpuUsage" TEXT,
ADD COLUMN     "temp" TEXT;

-- AlterTable
ALTER TABLE "server_history" ADD COLUMN     "gpuUsage" TEXT,
ADD COLUMN     "temp" TEXT;
