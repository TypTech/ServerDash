# ServerDash Update Manager

A comprehensive update management system that safely updates ServerDash without data loss, running in persistent screen sessions with real-time progress indicators.

## 📋 Overview

The update manager consists of:
- **🔍 Version Detection**: Checks GitHub releases for new versions
- **🛡️ Data Protection**: Automatic backups before updates
- **📊 Progress Tracking**: Real-time status bars and logging
- **🖥️ Screen Integration**: Persistent sessions you can safely detach from
- **✅ Verification**: Post-update health checks

## 🚀 Quick Start

### 1. Check for Updates (Web Interface)
- Go to **Dashboard → Settings → Update Manager**
- Click **"Check for Updates"** 
- View current vs latest version status
- Click **"View Release"** to see GitHub release notes

### 2. Automatic Update (Command Line)
```bash
# Run the update manager
./update-serverdash.sh

# Or test with the demo version
./test-update-serverdash.sh
```

## 📁 Files

| File | Description |
|------|-------------|
| `update-serverdash.sh` | 🔧 **Main update script** - Performs real updates |
| `test-update-serverdash.sh` | 🧪 **Demo script** - Simulates update process |
| `UPDATE_MANAGER_README.md` | 📖 **This documentation** |

## 🔧 Main Update Script (`update-serverdash.sh`)

### Features
- ✅ Connects to running ServerDash API to check versions
- ✅ Automatic backup of database, configs, and volumes
- ✅ Git-based code updates
- ✅ Docker container rebuilding
- ✅ Database migration handling
- ✅ Service health verification
- ✅ Rollback capabilities via backups

### Usage
```bash
# Make sure ServerDash is running first
npm run dev

# Run the update manager
./update-serverdash.sh
```

### What It Does
1. **🔍 Version Check**: Queries the GitHub API via your running ServerDash instance
2. **📋 Status Display**: Shows current vs latest version comparison
3. **💾 Backup Creation**: Creates timestamped backups in `./backups/`
4. **🔄 Update Process**: If update available:
   - Stops running services
   - Pulls latest code from Git
   - Updates dependencies
   - Rebuilds Docker containers
   - Runs database migrations
   - Restarts services
5. **✅ Verification**: Confirms update was successful

## 🧪 Demo Script (`test-update-serverdash.sh`)

### Purpose
Demonstrates the update process without making actual changes.

### Usage
```bash
./test-update-serverdash.sh
```

### What It Shows
- Progress bars and status updates
- Backup creation simulation
- Update process visualization
- Final success confirmation
- How the screen session works

## 🖥️ Screen Session Features

### Automatic Screen Management
- 🔄 **Auto-Start**: Automatically creates screen session if not already in one
- 📊 **Status Bar**: Shows "ServerDash Update Manager" with timestamp
- 🔒 **Persistent**: You can safely close terminal and reattach later
- 📝 **Logging**: All output logged to files

### Screen Commands
```bash
# View running screen sessions
screen -ls

# Reattach to update session
screen -r serverdash-update

# Reattach to demo session  
screen -r serverdash-update-demo

# Detach from session (Ctrl+A, then D)
# Session continues running in background
```

## 📊 Status Indicators

### Version Status
- 🟢 **Up to Date**: Current version ≥ latest release
- 🟠 **Update Available**: New version found on GitHub
- 🔴 **Error**: Cannot connect to API or GitHub

### Progress Bars
```
[====================] 100% Backing up database...
[==========----------] 50%  Updating dependencies...
[===================] 95%  Starting services...
```

### Final Status Display
```
╔════════════════════════════════════════════════════════════════════════════════╗
║                          UPDATE COMPLETED SUCCESSFULLY                          ║
║                                                                                ║
║  Current Version: 0.0.4-Pre-Release                                           ║
║  Updated From:    0.0.3-Pre-Release                                           ║
║                                                                                ║
║  ServerDash is now running the latest version!                                ║
║  Access: http://localhost:3000                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

## 🛡️ Safety Features

### Automatic Backups
- **📁 Location**: `./backups/backup_YYYYMMDD_HHMMSS/`
- **🗃️ Database**: Full PostgreSQL dump
- **⚙️ Configuration**: Environment files and settings
- **📦 Volumes**: Docker volume snapshots
- **📄 Custom Files**: Any custom configurations

### Error Handling
- **🔄 Rollback**: Use backups to restore previous state
- **📝 Logging**: Detailed logs in `update.log`
- **✅ Verification**: Health checks after updates
- **🛑 Safe Stops**: Graceful service shutdown

### Recovery Commands
```bash
# If update fails, restore from backup
docker-compose down
cp backups/backup_YYYYMMDD_HHMMSS/.env .
# Restore database from backup_YYYYMMDD_HHMMSS/database_backup.sql
docker-compose up -d
```

## 🔗 Integration with Web Interface

### Settings Page Features
- **📊 Real-time Status**: Current vs latest version display
- **🔄 Manual Check**: "Check for Updates" button
- **🌐 Release Links**: Direct links to GitHub releases
- **📅 Last Checked**: Timestamp of last update check
- **🏷️ Pre-release Detection**: Special badges for pre-releases

### API Integration
The update script uses your running ServerDash instance to:
- Query GitHub API through ServerDash's backend
- Respect rate limiting and caching
- Use authenticated requests
- Get formatted version information

## 📋 Requirements

### System Requirements
- **🐧 Linux**: Ubuntu, Debian, CentOS, Fedora, openSUSE, Arch
- **🐳 Docker**: For container management
- **📦 Git**: For code updates
- **🖥️ Screen**: For persistent sessions (auto-installed)
- **⚡ jq**: For JSON parsing (auto-installed)

### ServerDash Requirements
- **🚀 Running Instance**: ServerDash must be accessible at http://localhost:3000
- **🔧 Development Mode**: Use `npm run dev` for development
- **🐳 Production Mode**: Use `docker-compose up -d` for production

## 🚨 Important Notes

### Before Running Updates
1. **💾 Ensure Data is Saved**: All work should be committed/saved
2. **🔄 Stop Heavy Processes**: Pause any intensive operations
3. **📧 Check Notifications**: Ensure you can receive alerts if something goes wrong
4. **⏰ Plan Downtime**: Updates require temporary service interruption

### Current Version Behavior
With version `0.0.4-dev` (ahead of latest release `v0.0.3-Pre-Release`):
- ✅ Shows "Up to Date" status (correct behavior)
- ✅ No update performed (as expected)
- ✅ All functionality works normally

When a new release becomes available (e.g., `v0.0.4` or higher):
- 🟠 Will show "Update Available"
- 🔄 Will perform automatic update process
- 📄 Will display release notes and information

## 🔧 Troubleshooting

### Common Issues

**❌ "Cannot connect to ServerDash API"**
```bash
# Make sure ServerDash is running
npm run dev
# Or for production
docker-compose up -d
```

**❌ "Screen command not found"**
```bash
# Script will auto-install, or manually install:
sudo apt-get install screen
```

**❌ "jq command not found"**
```bash
# Script will auto-install, or manually install:
sudo apt-get install jq
```

**❌ Update stuck or failed**
```bash
# Kill any hanging processes
screen -ls
screen -r serverdash-update
# Press Ctrl+C to stop, then review logs
cat update.log
```

### Log Files
- **📄 Main Updates**: `update.log`
- **📄 Demo Tests**: `update-test.log`
- **📁 Backups**: `./backups/backup_YYYYMMDD_HHMMSS/`

## 🤝 Contributing

Found an issue or want to improve the update manager?
1. 🍴 Fork the repository
2. 🔧 Make your changes
3. 🧪 Test with both scripts
4. 📥 Submit a pull request

## 📜 License

This update manager is part of ServerDash and follows the same MIT license.

---

**⚠️ Always test the demo script first to familiarize yourself with the process!**

```bash
./test-update-serverdash.sh
``` 