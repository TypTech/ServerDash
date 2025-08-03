import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  html_url: string
  body?: string
  prerelease: boolean
  draft: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Get current version from package.json dynamically
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const currentVersion = packageJson.version || "1.0.0"
    
    // Fetch all releases from GitHub (including pre-releases)
    const response = await fetch('https://api.github.com/repos/TypTech/ServerDash/releases', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ServerDash-UpdateChecker'
      },
      // Cache for 10 minutes to avoid rate limiting
      next: { revalidate: 600 }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'No releases found for this repository'
        }, { status: 404 })
      }
      throw new Error(`GitHub API responded with status: ${response.status}`)
    }

    const releases: GitHubRelease[] = await response.json()
    
    // Filter out draft releases and find the latest release (including pre-releases)
    const validReleases = releases.filter(release => !release.draft)
    
    if (validReleases.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid releases found for this repository'
      }, { status: 404 })
    }
    
    // Get the latest release (first in the array as GitHub orders them by date)
    const latestRelease: GitHubRelease = validReleases[0]
    
    // Clean version numbers (remove 'v' prefix if present)
    const cleanCurrentVersion = currentVersion.replace(/^v/, '')
    const cleanLatestVersion = latestRelease.tag_name.replace(/^v/, '')
    
    // Simple version comparison (works for semantic versioning)
    const isUpdateAvailable = compareVersions(cleanLatestVersion, cleanCurrentVersion) > 0
    
    return NextResponse.json({
      success: true,
      currentVersion: cleanCurrentVersion,
      latestVersion: cleanLatestVersion,
      updateAvailable: isUpdateAvailable,
      releaseInfo: {
        name: latestRelease.name,
        publishedAt: latestRelease.published_at,
        htmlUrl: latestRelease.html_url,
        body: latestRelease.body || '',
        isPrerelease: latestRelease.prerelease
      },
      lastChecked: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Failed to check for ServerDash updates:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check for updates'
    }, { status: 500 })
  }
}

// Enhanced semantic version comparison that handles pre-release tags
function compareVersions(version1: string, version2: string): number {
  // Remove pre-release tags for comparison (everything after -)
  const cleanVersion1 = version1.split('-')[0]
  const cleanVersion2 = version2.split('-')[0]
  
  const v1parts = cleanVersion1.split('.').map(n => parseInt(n, 10) || 0)
  const v2parts = cleanVersion2.split('.').map(n => parseInt(n, 10) || 0)
  
  // Pad arrays to same length
  const maxLength = Math.max(v1parts.length, v2parts.length)
  while (v1parts.length < maxLength) v1parts.push(0)
  while (v2parts.length < maxLength) v2parts.push(0)
  
  for (let i = 0; i < maxLength; i++) {
    if (v1parts[i] > v2parts[i]) return 1
    if (v1parts[i] < v2parts[i]) return -1
  }
  
  // If base versions are equal, check pre-release status
  const v1HasPrerelease = version1.includes('-')
  const v2HasPrerelease = version2.includes('-')
  
  // If one has pre-release and other doesn't, non-prerelease is considered newer
  if (v1HasPrerelease && !v2HasPrerelease) return -1
  if (!v1HasPrerelease && v2HasPrerelease) return 1
  
  return 0
} 