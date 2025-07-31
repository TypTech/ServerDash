"use client"

import { useState, useEffect } from 'react'
import { Terminal, Loader2 } from 'lucide-react'
import { Button } from './ui/button'

interface TerminalWrapperProps {
  applicationId: number
  applicationName: string
  containerId: string
  onClose: () => void
}

export function TerminalWrapper({ applicationId, applicationName, containerId, onClose }: TerminalWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const [WebTerminal, setWebTerminal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Dynamically import the WebTerminal component
    const loadTerminal = async () => {
      try {
        const terminalModule = await import('./WebTerminal')
        setWebTerminal(() => terminalModule.WebTerminal)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load terminal:', err)
        setError('Failed to load terminal component')
        setLoading(false)
      }
    }

    loadTerminal()
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 text-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Initializing terminal...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 text-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading terminal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-900 text-white">
        <div className="text-center">
          <Terminal className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold mb-2">Terminal Unavailable</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-sm">Alternative access methods:</p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const command = `docker exec -it ${containerId} /bin/sh`
                await navigator.clipboard.writeText(command)
                alert(`Command copied to clipboard:\n${command}`)
              }}
              className="mr-2"
            >
              Copy SSH Command
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!WebTerminal) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 text-white">
        <div className="text-center">
          <Terminal className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
          <p>Terminal component not available</p>
          <Button variant="outline" size="sm" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <WebTerminal
      applicationId={applicationId}
      applicationName={applicationName}
      containerId={containerId}
      onClose={onClose}
    />
  )
} 