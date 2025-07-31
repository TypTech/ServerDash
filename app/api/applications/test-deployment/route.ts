import { NextRequest, NextResponse } from "next/server"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const testResults = {
      dockerAvailable: false,
      dockerDaemonRunning: false,
      canPullImages: false,
      canRunContainers: false,
      systemResources: {
        diskSpace: '',
        memory: '',
        recommendations: [] as string[]
      },
      errors: [] as string[]
    }

    // Test 1: Check if Docker is available
    try {
      await execAsync('docker --version')
      testResults.dockerAvailable = true
    } catch (error) {
      testResults.errors.push('Docker is not installed or not accessible')
    }

    // Test 2: Check if Docker daemon is running
    if (testResults.dockerAvailable) {
      try {
        await execAsync('docker info')
        testResults.dockerDaemonRunning = true
      } catch (error) {
        testResults.errors.push('Docker daemon is not running')
      }
    }

    // Test 3: Try to pull a small image
    if (testResults.dockerDaemonRunning) {
      try {
        await execAsync('docker pull hello-world:latest')
        testResults.canPullImages = true
      } catch (error) {
        testResults.errors.push('Cannot pull Docker images - check internet connection')
      }
    }

    // Test 4: Try to run a container
    if (testResults.canPullImages) {
      try {
        await execAsync('docker run --rm hello-world')
        testResults.canRunContainers = true
      } catch (error) {
        testResults.errors.push('Cannot run Docker containers')
      }
    }

    // Test 5: Check system resources
    try {
      // Check disk space
      const { stdout: diskOutput } = await execAsync('df / | awk \'NR==2 {print $4}\'')
      const availableSpaceKB = parseInt(diskOutput.trim())
      const availableSpaceGB = Math.round(availableSpaceKB / 1024 / 1024)
      testResults.systemResources.diskSpace = `${availableSpaceGB}GB available`
      
      if (availableSpaceGB < 5) {
        testResults.systemResources.recommendations.push('Consider freeing disk space (recommended: 5GB+)')
      }

      // Check memory
      const { stdout: memOutput } = await execAsync('free -m | awk \'NR==2{print $7}\'')
      const availableMemoryMB = parseInt(memOutput.trim())
      testResults.systemResources.memory = `${availableMemoryMB}MB available`
      
      if (availableMemoryMB < 1024) {
        testResults.systemResources.recommendations.push('Consider adding more RAM (recommended: 1GB+ available)')
      }
    } catch (error) {
      testResults.errors.push('Could not check system resources')
    }

    // Overall status
    const allTestsPassed = testResults.dockerAvailable && 
                          testResults.dockerDaemonRunning && 
                          testResults.canPullImages && 
                          testResults.canRunContainers

    return NextResponse.json({
      success: allTestsPassed,
      ready: allTestsPassed && testResults.errors.length === 0,
      testResults,
      message: allTestsPassed ? 
        'System is ready for application deployments!' : 
        'System needs configuration before deploying applications',
      recommendations: [
        ...testResults.systemResources.recommendations,
        ...(testResults.errors.length > 0 ? ['Fix the errors listed above'] : []),
        'Run the setup script: ./setup-applications.sh'
      ]
    })

  } catch (error: any) {
    console.error('Deployment test error:', error)
    return NextResponse.json(
      { 
        success: false,
        ready: false,
        error: error.message || 'Failed to test deployment readiness',
        message: 'Could not complete deployment readiness test'
      },
      { status: 500 }
    )
  }
} 