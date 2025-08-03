import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Get real system statistics
    const systemStats = await getRealSystemStats()
    
    return NextResponse.json({
      success: true,
      ...systemStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get system stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get system statistics' 
    }, { status: 500 })
  }
}

async function getRealSystemStats() {
  try {
    let uptime = 'Unknown'
    let systemLoad = 0
    let loadAverage = { '1min': 0, '5min': 0, '15min': 0 }
    let uptimeSeconds = 0
    let bootTime = ''

    // Get system uptime
    try {
      const uptimeData = await readFile('/proc/uptime', 'utf8')
      const uptimeSecondsFloat = parseFloat(uptimeData.split(' ')[0])
      uptimeSeconds = Math.floor(uptimeSecondsFloat)
      
      // Convert seconds to human readable format
      const days = Math.floor(uptimeSeconds / (24 * 60 * 60))
      const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60)
      
      uptime = `${days}d ${hours}h ${minutes}m`
      
      // Calculate boot time
      const bootTimestamp = new Date(Date.now() - (uptimeSeconds * 1000))
      bootTime = bootTimestamp.toISOString()
    } catch {
      // Fallback to uptime command
      try {
        const { stdout } = await execAsync('uptime -p')
        uptime = stdout.trim().replace('up ', '')
      } catch {
        uptime = 'Unknown'
      }
    }

    // Get system load average
    try {
      const loadavgData = await readFile('/proc/loadavg', 'utf8')
      const loads = loadavgData.split(' ')
      loadAverage = {
        '1min': parseFloat(loads[0]) || 0,
        '5min': parseFloat(loads[1]) || 0,
        '15min': parseFloat(loads[2]) || 0
      }
      
      // Calculate system load percentage (based on number of CPU cores)
      try {
        const { stdout: cpuInfo } = await execAsync('nproc')
        const cpuCores = parseInt(cpuInfo.trim()) || 1
        systemLoad = Math.min((loadAverage['1min'] / cpuCores) * 100, 100)
      } catch {
        // Fallback: assume load average represents percentage directly
        systemLoad = Math.min(loadAverage['1min'] * 25, 100) // Rough approximation
      }
    } catch {
      // Fallback to uptime command for load
      try {
        const { stdout } = await execAsync('uptime')
        const loadMatch = stdout.match(/load average: ([\d.]+), ([\d.]+), ([\d.]+)/)
        if (loadMatch) {
          loadAverage = {
            '1min': parseFloat(loadMatch[1]) || 0,
            '5min': parseFloat(loadMatch[2]) || 0,
            '15min': parseFloat(loadMatch[3]) || 0
          }
          systemLoad = Math.min(loadAverage['1min'] * 25, 100)
        }
      } catch {
        systemLoad = 0
      }
    }

    // Get additional system metrics
    let memoryUsage = 0
    let diskUsage = 0
    let cpuUsage = 0

    // Memory usage
    try {
      const meminfo = await readFile('/proc/meminfo', 'utf8')
      const memTotal = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || '0')
      const memAvailable = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || '0')
      const memFree = parseInt(meminfo.match(/MemFree:\s+(\d+)/)?.[1] || '0')
      
      if (memTotal > 0) {
        const usedMem = memTotal - (memAvailable || memFree)
        memoryUsage = (usedMem / memTotal) * 100
      }
    } catch {
      try {
        const { stdout } = await execAsync('free | grep Mem | awk \'{print ($3/$2) * 100.0}\'')
        memoryUsage = parseFloat(stdout.trim()) || 0
      } catch {
        memoryUsage = 0
      }
    }

    // Disk usage (root filesystem)
    try {
      const { stdout } = await execAsync('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'')
      diskUsage = parseFloat(stdout.trim()) || 0
    } catch {
      diskUsage = 0
    }

    // CPU usage (1-second average)
    try {
      const { stdout } = await execAsync('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'')
      cpuUsage = parseFloat(stdout.trim()) || 0
    } catch {
      try {
        // Alternative method using /proc/stat
        const stat1 = await readFile('/proc/stat', 'utf8')
        await new Promise(resolve => setTimeout(resolve, 1000))
        const stat2 = await readFile('/proc/stat', 'utf8')
        
        const getCpuTimes = (stat: string) => {
          const cpuLine = stat.split('\n')[0]
          const times = cpuLine.split(/\s+/).slice(1).map(Number)
          return times.reduce((sum, time) => sum + time, 0)
        }
        
        const total1 = getCpuTimes(stat1)
        const total2 = getCpuTimes(stat2)
        const idle1 = parseInt(stat1.split('\n')[0].split(/\s+/)[4])
        const idle2 = parseInt(stat2.split('\n')[0].split(/\s+/)[4])
        
        const totalDiff = total2 - total1
        const idleDiff = idle2 - idle1
        
        if (totalDiff > 0) {
          cpuUsage = 100 - (idleDiff / totalDiff * 100)
        }
      } catch {
        cpuUsage = 0
      }
    }

    // Get uptime history (mock for now, can be extended with database storage)
    const uptimeHistory = {
      last24h: 99.9, // Would calculate from stored data
      last7d: 99.5,  // Would calculate from stored data
      last30d: 99.2  // Would calculate from stored data
    }

    return {
      uptime,
      uptimeSeconds,
      bootTime,
      systemLoad: Math.round(systemLoad * 10) / 10,
      loadAverage,
      memoryUsage: Math.round(memoryUsage * 10) / 10,
      diskUsage: Math.round(diskUsage * 10) / 10,
      cpuUsage: Math.round(cpuUsage * 10) / 10,
      uptimeHistory
    }
  } catch (error) {
    console.error('Error getting system stats:', error)
    return {
      uptime: 'Unknown',
      uptimeSeconds: 0,
      bootTime: '',
      systemLoad: 0,
      loadAverage: { '1min': 0, '5min': 0, '15min': 0 },
      memoryUsage: 0,
      diskUsage: 0,
      cpuUsage: 0,
      uptimeHistory: { last24h: 0, last7d: 0, last30d: 0 }
    }
  }
} 