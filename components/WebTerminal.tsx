"use client"

import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { Button } from './ui/button'
import { X, Copy, RefreshCw } from 'lucide-react'

interface WebTerminalProps {
  applicationId: number
  applicationName: string
  containerId: string
  onClose: () => void
}

export function WebTerminal({ applicationId, applicationName, containerId, onClose }: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [terminal, setTerminal] = useState<Terminal | null>(null)
  const [connected, setConnected] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [currentCommand, setCurrentCommand] = useState('')
  const currentLineRef = useRef('')

  // Execute command function - moved outside useEffect to avoid closure issues
  const executeCommand = async (command: string, term: Terminal) => {
    if (command === 'help') {
      term.writeln('\x1b[33mAvailable commands:\x1b[0m')
      term.writeln('  help     - Show this help message')
      term.writeln('  clear    - Clear the terminal')
      term.writeln('  exit     - Close the terminal')
      term.writeln('  \x1b[36mCommon commands to try:\x1b[0m')
      term.writeln('  whoami   - Show current user')
      term.writeln('  pwd      - Print working directory')
      term.writeln('  ls       - List files')
      term.writeln('  ps       - Show running processes')
      term.writeln('  env      - Show environment variables')
      term.writeln('  cat /etc/os-release - Show OS info')
      term.writeln('  \x1b[31mNote: Not all commands may be available in minimal containers\x1b[0m')
      term.writeln('')
      term.write('$ ')
      return
    }

    if (command === 'clear') {
      term.clear()
      term.write('$ ')
      return
    }

    if (command === 'exit') {
      term.writeln('\x1b[31mClosing terminal...\x1b[0m')
      setTimeout(onClose, 1000)
      return
    }

    // Execute command in container
    try {
      const response = await fetch('/api/applications/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          command: command,
          interactive: false
        })
      })

      const result = await response.json()

      if (result.success && result.output) {
        // Handle multi-line output
        const lines = result.output.split('\n')
        lines.forEach((line: string) => {
          term.writeln(line) // Write all lines, including empty ones for proper formatting
        })
      } else {
        term.writeln(`\x1b[31mError: ${result.error || 'Command failed'}\x1b[0m`)
      }
    } catch (error) {
      term.writeln(`\x1b[31mError: Failed to execute command\x1b[0m`)
    }

    term.writeln('')
    term.write('$ ')
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !terminalRef.current) return

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bfbfbf',
        brightBlack: '#4d4d4d',
        brightRed: '#ff6e67',
        brightGreen: '#5af78e',
        brightYellow: '#f4f99d',
        brightBlue: '#caa9fa',
        brightMagenta: '#ff92d0',
        brightCyan: '#9aedfe',
        brightWhite: '#e6e6e6'
      }
    })

    // Add addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    // Open terminal
    term.open(terminalRef.current)
    fitAddon.fit()

    // Welcome message
    term.writeln(`\x1b[32m┌─ Container Terminal: ${applicationName}\x1b[0m`)
    term.writeln(`\x1b[32m├─ Container ID: ${containerId.substring(0, 12)}\x1b[0m`)
    term.writeln(`\x1b[32m├─ Type 'help' for available commands\x1b[0m`)
    term.writeln(`\x1b[32m└─ Note: Some containers may have limited tools available\x1b[0m`)
    term.writeln('')

    let historyIndex = -1

    // Handle input
    term.onData((data) => {
      const code = data.charCodeAt(0)

      if (code === 13) { // Enter
        term.writeln('')
        if (currentLineRef.current.trim()) {
          executeCommand(currentLineRef.current.trim(), term)
          setCommandHistory(prev => [...prev, currentLineRef.current.trim()])
          setCurrentCommand('')
        } else {
          term.write('$ ')
        }
        currentLineRef.current = ''
        historyIndex = -1
      } else if (code === 127) { // Backspace
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1)
          term.write('\b \b')
        }
      } else if (code === 27) { // Escape sequences (arrow keys)
        // Handle arrow keys for command history
        if (data === '\x1b[A') { // Up arrow
          if (commandHistory.length > 0) {
            historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
            const historyCommand = commandHistory[commandHistory.length - 1 - historyIndex]
            term.write('\x1b[2K\r$ ' + historyCommand)
            currentLineRef.current = historyCommand
          }
        } else if (data === '\x1b[B') { // Down arrow
          if (historyIndex > 0) {
            historyIndex -= 1
            const historyCommand = commandHistory[commandHistory.length - 1 - historyIndex]
            term.write('\x1b[2K\r$ ' + historyCommand)
            currentLineRef.current = historyCommand
          } else if (historyIndex === 0) {
            historyIndex = -1
            term.write('\x1b[2K\r$ ')
            currentLineRef.current = ''
          }
        }
      } else if (code >= 32 && code <= 126) { // Printable characters
        currentLineRef.current += data
        term.write(data)
      }
    })

    term.write('$ ')
    setTerminal(term)
    setConnected(true)

    // Handle resize
    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [applicationId, applicationName, containerId, onClose])

  const clearTerminal = () => {
    if (terminal) {
      terminal.clear()
      terminal.write('$ ')
    }
  }

  const copyContent = () => {
    if (terminal) {
      const content = terminal.getSelection()
      if (content) {
        navigator.clipboard.writeText(content)
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="ml-3 text-sm font-medium">
            {applicationName} Terminal
          </span>
          {connected && (
            <div className="flex items-center space-x-1 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Connected</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyContent}
            className="text-gray-400 hover:text-white"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-2">
        <div
          ref={terminalRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  )
} 