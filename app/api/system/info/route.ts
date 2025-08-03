import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Get OS information
    const osInfo = await getOSInfo()
    
    return NextResponse.json({
      success: true,
      ...osInfo
    })
  } catch (error) {
    console.error('Failed to get system info:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get system information' 
    }, { status: 500 })
  }
}

async function getOSInfo() {
  try {
    // Get OS release information
    let osName = 'Unknown'
    let kernel = 'Unknown'
    let architecture = 'Unknown'
    let uptime = 'Unknown'
    let packageManager = 'Unknown'

    try {
      // Get OS name
      const { stdout: osOutput } = await execAsync('lsb_release -d 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\'')
      osName = osOutput.trim() || 'Linux'
    } catch {
      try {
        const { stdout: unameOutput } = await execAsync('uname -o')
        osName = unameOutput.trim()
      } catch {
        osName = 'Linux'
      }
    }

    try {
      // Get kernel version
      const { stdout: kernelOutput } = await execAsync('uname -r')
      kernel = kernelOutput.trim()
    } catch {
      kernel = 'Unknown'
    }

    try {
      // Get architecture
      const { stdout: archOutput } = await execAsync('uname -m')
      architecture = archOutput.trim()
    } catch {
      architecture = 'Unknown'
    }

    try {
      // Get uptime
      const { stdout: uptimeOutput } = await execAsync('uptime -p 2>/dev/null || uptime')
      uptime = uptimeOutput.trim().replace('up ', '')
    } catch {
      uptime = 'Unknown'
    }

    // Detect package manager
    try {
      await execAsync('which apt 2>/dev/null')
      packageManager = 'apt (Debian/Ubuntu)'
    } catch {
      try {
        await execAsync('which yum 2>/dev/null')
        packageManager = 'yum (Red Hat/CentOS)'
      } catch {
        try {
          await execAsync('which dnf 2>/dev/null')
          packageManager = 'dnf (Fedora)'
        } catch {
          try {
            await execAsync('which pacman 2>/dev/null')
            packageManager = 'pacman (Arch)'
          } catch {
            try {
              await execAsync('which zypper 2>/dev/null')
              packageManager = 'zypper (openSUSE)'
            } catch {
              packageManager = 'Unknown'
            }
          }
        }
      }
    }

    return {
      os: osName,
      kernel,
      architecture,
      uptime,
      packageManager
    }
  } catch (error) {
    console.error('Error getting OS info:', error)
    return {
      os: 'Unknown',
      kernel: 'Unknown',
      architecture: 'Unknown',
      uptime: 'Unknown',
      packageManager: 'Unknown'
    }
  }
} 