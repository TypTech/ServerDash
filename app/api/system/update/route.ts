import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Perform system update
    const result = await performSystemUpdate()
    
    return NextResponse.json({
      success: true,
      message: 'System update completed successfully',
      ...result
    })
  } catch (error: any) {
    console.error('Failed to perform system update:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to perform system update' 
    }, { status: 500 })
  }
}

async function performSystemUpdate() {
  try {
    let packageManager = 'unknown'
    let updatedPackages = 0
    let output = ''

    // Detect package manager and perform update
    try {
      await execAsync('which apt 2>/dev/null')
      packageManager = 'apt'
      
      // Perform apt update and upgrade
      console.log('Performing apt update and upgrade...')
      
      // First update package lists
      await execAsync('sudo apt update -qq', { timeout: 120000 })
      
      // Then upgrade packages (non-interactive)
      const { stdout } = await execAsync('sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y', { timeout: 600000 })
      output = stdout
      
      // Count updated packages
      const upgradedLines = output.split('\n').filter(line => 
        line.includes('upgraded') || line.includes('newly installed') || line.includes('to remove')
      )
      if (upgradedLines.length > 0) {
        const match = upgradedLines[0].match(/(\d+)\s+upgraded/)
        updatedPackages = match ? parseInt(match[1]) : 0
      }
      
    } catch {
      // Try yum (Red Hat/CentOS)
      try {
        await execAsync('which yum 2>/dev/null')
        packageManager = 'yum'
        
        console.log('Performing yum update...')
        const { stdout } = await execAsync('sudo yum update -y', { timeout: 600000 })
        output = stdout
        
        // Count updated packages for yum
        const updatedLines = output.split('\n').filter(line => line.includes('Updated:'))
        updatedPackages = updatedLines.length
        
      } catch {
        // Try dnf (Fedora)
        try {
          await execAsync('which dnf 2>/dev/null')
          packageManager = 'dnf'
          
          console.log('Performing dnf update...')
          const { stdout } = await execAsync('sudo dnf update -y', { timeout: 600000 })
          output = stdout
          
          // Count updated packages for dnf
          const updatedLines = output.split('\n').filter(line => line.includes('Upgraded'))
          updatedPackages = updatedLines.length
          
        } catch {
          // Try pacman (Arch)
          try {
            await execAsync('which pacman 2>/dev/null')
            packageManager = 'pacman'
            
            console.log('Performing pacman update...')
            const { stdout } = await execAsync('sudo pacman -Syu --noconfirm', { timeout: 600000 })
            output = stdout
            
            // Count updated packages for pacman
            const upgradingLines = output.split('\n').filter(line => line.includes('upgrading'))
            updatedPackages = upgradingLines.length
            
          } catch {
            // Try zypper (openSUSE)
            try {
              await execAsync('which zypper 2>/dev/null')
              packageManager = 'zypper'
              
              console.log('Performing zypper update...')
              const { stdout } = await execAsync('sudo zypper update -y', { timeout: 600000 })
              output = stdout
              
              // Count updated packages for zypper
              const upgradeLines = output.split('\n').filter(line => line.includes('upgraded'))
              updatedPackages = upgradeLines.length
              
            } catch {
              throw new Error('No supported package manager found or update failed')
            }
          }
        }
      }
    }

    return {
      packageManager,
      updatedPackages,
      timestamp: new Date().toISOString(),
      summary: output.split('\n').slice(-10).join('\n') // Last 10 lines for summary
    }
    
  } catch (error: any) {
    console.error('Error performing system update:', error)
    throw new Error(`System update failed: ${error.message}`)
  }
}

// Optional: Add a route to check if user has sudo privileges
export async function GET(request: NextRequest) {
  try {
    // Check if we can run sudo commands
    await execAsync('sudo -n true 2>/dev/null', { timeout: 5000 })
    
    return NextResponse.json({
      success: true,
      canUpdate: true,
      message: 'System update capability available'
    })
  } catch {
    return NextResponse.json({
      success: false,
      canUpdate: false,
      message: 'System update requires sudo privileges'
    })
  }
} 