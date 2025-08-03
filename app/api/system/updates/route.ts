import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Check for available updates
    const updateInfo = await checkForUpdates()
    
    return NextResponse.json({
      success: true,
      ...updateInfo,
      lastChecked: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to check for updates:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check for updates' 
    }, { status: 500 })
  }
}

async function checkForUpdates() {
  try {
    // Detect package manager and check for updates
    let packageManager = 'unknown'
    let total = 0
    let security = 0
    let updates: string[] = []

    // Try apt (Debian/Ubuntu)
    try {
      await execAsync('which apt 2>/dev/null')
      packageManager = 'apt'
      
      // Update package list first (non-interactive)
      try {
        await execAsync('sudo apt update -qq 2>/dev/null || apt list --upgradable 2>/dev/null >/dev/null')
      } catch {
        // If apt update fails, continue anyway
      }
      
      // Check for upgradable packages
      try {
        const { stdout } = await execAsync('apt list --upgradable 2>/dev/null | grep -v "WARNING" | tail -n +2')
        const lines = stdout.trim().split('\n').filter(line => line.trim())
        total = lines.length
        updates = lines.slice(0, 10) // Limit to first 10 for display
        
        // Check for security updates
        try {
          const { stdout: secOutput } = await execAsync('apt list --upgradable 2>/dev/null | grep -i security | wc -l')
          security = parseInt(secOutput.trim()) || 0
        } catch {
          security = 0
        }
      } catch {
        total = 0
        updates = []
      }
    } catch {
      // Try yum (Red Hat/CentOS)
      try {
        await execAsync('which yum 2>/dev/null')
        packageManager = 'yum'
        
        const { stdout } = await execAsync('yum check-update 2>/dev/null | grep -v "Loaded plugins" | grep -v "Last metadata" | tail -n +2 || true')
        const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('Loaded plugins'))
        total = lines.length
        updates = lines.slice(0, 10)
        
        // Check for security updates
        try {
          const { stdout: secOutput } = await execAsync('yum updateinfo list security 2>/dev/null | wc -l || echo "0"')
          security = parseInt(secOutput.trim()) || 0
        } catch {
          security = 0
        }
      } catch {
        // Try dnf (Fedora)
        try {
          await execAsync('which dnf 2>/dev/null')
          packageManager = 'dnf'
          
          const { stdout } = await execAsync('dnf check-update 2>/dev/null | tail -n +2 || true')
          const lines = stdout.trim().split('\n').filter(line => line.trim())
          total = lines.length
          updates = lines.slice(0, 10)
          
          // Check for security updates
          try {
            const { stdout: secOutput } = await execAsync('dnf updateinfo list security 2>/dev/null | wc -l || echo "0"')
            security = parseInt(secOutput.trim()) || 0
          } catch {
            security = 0
          }
        } catch {
          // Try pacman (Arch)
          try {
            await execAsync('which pacman 2>/dev/null')
            packageManager = 'pacman'
            
            const { stdout } = await execAsync('pacman -Qu 2>/dev/null || true')
            const lines = stdout.trim().split('\n').filter(line => line.trim())
            total = lines.length
            updates = lines.slice(0, 10)
            security = 0 // pacman doesn't distinguish security updates
          } catch {
            // Try zypper (openSUSE)
            try {
              await execAsync('which zypper 2>/dev/null')
              packageManager = 'zypper'
              
              const { stdout } = await execAsync('zypper list-updates 2>/dev/null | grep -v "Repository" | grep -v "Loading" | tail -n +5 || true')
              const lines = stdout.trim().split('\n').filter(line => line.trim())
              total = lines.length
              updates = lines.slice(0, 10)
              
              // Check for security updates
              try {
                const { stdout: secOutput } = await execAsync('zypper list-patches --category security 2>/dev/null | grep -v "Repository" | wc -l || echo "0"')
                security = parseInt(secOutput.trim()) || 0
              } catch {
                security = 0
              }
            } catch {
              // No supported package manager found
              packageManager = 'unknown'
              total = 0
              updates = []
              security = 0
            }
          }
        }
      }
    }

    return {
      total: total || 0,
      security: security || 0,
      updates: updates.slice(0, 10), // Limit for performance
      packageManager
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return {
      total: 0,
      security: 0,
      updates: [],
      packageManager: 'unknown'
    }
  }
} 