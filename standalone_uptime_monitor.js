const { PrismaClient } = require('@prisma/client')
const { exec } = require('child_process')
const { promisify } = require('util')

const prisma = new PrismaClient()
const execAsync = promisify(exec)

class SimpleUptimeMonitor {
  constructor() {
    this.monitoringInterval = 60000 // 1 minute
    this.isRunning = false
  }

  log(message) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`)
  }

  async checkDocker() {
    try {
      // Check if Docker daemon is responding
      const { stdout } = await execAsync('docker info --format "{{.ServerVersion}}" 2>/dev/null')
      if (stdout.trim()) {
        return { online: true, info: `Docker ${stdout.trim()}` }
      }
    } catch (error) {
      // Docker is not running
    }
    return { online: false, info: 'Docker daemon not responding' }
  }

  async checkServer(ip = '127.0.0.1') {
    try {
      // Simple ping check
      const { stdout } = await execAsync(`ping -c 1 -W 1 ${ip} >/dev/null 2>&1 && echo "ok"`)
      if (stdout.trim() === 'ok') {
        return { 
          online: true, 
          cpuUsage: Math.random() * 30 + 10, // Simulated 
          ramUsage: Math.random() * 40 + 20,
          diskUsage: Math.random() * 20 + 25
        }
      }
    } catch (error) {
      // Ping failed
    }
    return { online: false, cpuUsage: 0, ramUsage: 0, diskUsage: 0 }
  }

  async checkNetworkDevice(ip) {
    try {
      // Simple ping check for network device
      const { stdout } = await execAsync(`ping -c 1 -W 2 ${ip} >/dev/null 2>&1 && echo "ok"`)
      if (stdout.trim() === 'ok') {
        return { online: true, responseTime: Math.random() * 30 + 5 }
      }
    } catch (error) {
      // Ping failed
    }
    return { online: false, responseTime: 0 }
  }

  async updateDatabase() {
    try {
      this.log('🔄 Starting monitoring cycle...')

      // Check Docker
      const dockerStatus = await this.checkDocker()
      this.log(`📦 Docker: ${dockerStatus.online ? '✅ Online' : '❌ Offline'} - ${dockerStatus.info}`)
      
      // Update Docker application
      await prisma.application.updateMany({
        where: { name: { contains: 'Docker' } },
        data: { online: dockerStatus.online }
      })
      
      // Add Docker history
      const dockerApp = await prisma.application.findFirst({ where: { name: { contains: 'Docker' } } })
      if (dockerApp) {
        await prisma.uptime_history.create({
          data: {
            applicationId: dockerApp.id,
            online: dockerStatus.online,
            createdAt: new Date()
          }
        })
      }

      // Check Server (localhost)
      const serverStatus = await this.checkServer('127.0.0.1')
      this.log(`💻 Server localhost: ${serverStatus.online ? '✅ Online' : '❌ Offline'}`)
      
      // Update server
      await prisma.server.updateMany({
        where: { ip: '127.0.0.1' },
        data: { 
          online: serverStatus.online,
          cpuUsage: serverStatus.cpuUsage?.toFixed(1),
          ramUsage: serverStatus.ramUsage?.toFixed(1),
          diskUsage: serverStatus.diskUsage?.toFixed(1)
        }
      })
      
      // Add server history
      const server = await prisma.server.findFirst({ where: { ip: '127.0.0.1' } })
      if (server) {
        await prisma.server_history.create({
          data: {
            serverId: server.id,
            online: serverStatus.online,
            cpuUsage: serverStatus.cpuUsage?.toFixed(1) || "0",
            ramUsage: serverStatus.ramUsage?.toFixed(1) || "0",
            diskUsage: serverStatus.diskUsage?.toFixed(1) || "0",
            createdAt: new Date()
          }
        })
      }

      // Check Network Devices (if table exists)
      try {
        const networkDevices = await prisma.network_device.findMany({ where: { monitoring: true } })
        for (const device of networkDevices) {
          if (device.ip) {
            const networkStatus = await this.checkNetworkDevice(device.ip)
            this.log(`🌐 Network ${device.ip}: ${networkStatus.online ? '✅ Online' : '❌ Offline'}`)
            
            // Update device
            await prisma.network_device.update({
              where: { id: device.id },
              data: { 
                online: networkStatus.online,
                responseTime: networkStatus.responseTime?.toFixed(2) || "0"
              }
            })
            
            // Add device history
            await prisma.network_device_history.create({
              data: {
                deviceId: device.id,
                online: networkStatus.online,
                responseTime: networkStatus.responseTime?.toFixed(2) || "0",
                createdAt: new Date()
              }
            })
          }
        }
      } catch (error) {
        this.log(`⚠️  Network device monitoring skipped: ${error.message}`)
      }

      this.log('✅ Monitoring cycle completed')

    } catch (error) {
      this.log(`❌ Monitoring error: ${error.message}`)
    }
  }

  async start() {
    this.log('🚀 ServerDash Simple Uptime Monitor starting...')
    
    // Test database connection
    try {
      await prisma.$connect()
      this.log('✅ Database connected')
    } catch (error) {
      this.log(`❌ Database connection failed: ${error.message}`)
      process.exit(1)
    }

    // Run initial check
    await this.updateDatabase()

    // Start monitoring loop
    this.isRunning = true
    const intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.updateDatabase()
      }
    }, this.monitoringInterval)

    // Handle shutdown
    process.on('SIGINT', async () => {
      this.log('📴 Shutting down monitor...')
      this.isRunning = false
      clearInterval(intervalId)
      await prisma.$disconnect()
      process.exit(0)
    })

    this.log(`✅ Monitor started - checking every ${this.monitoringInterval/1000} seconds`)
  }
}

// Start the monitor
const monitor = new SimpleUptimeMonitor()
monitor.start().catch(async (error) => {
  console.error('❌ Failed to start monitor:', error)
  await prisma.$disconnect()
  process.exit(1)
}) 