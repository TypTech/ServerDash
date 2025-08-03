#!/bin/bash

# ServerDash Update Manager Script - TEST VERSION
# This simulates an update being available for demonstration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/update-test.log"

# Create necessary directories
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to show progress bar
show_progress() {
    local current=$1
    local total=$2
    local message=$3
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "\r${CYAN}[${NC}"
    printf "%*s" $filled | tr ' ' '='
    printf "%*s" $empty | tr ' ' '-'
    printf "${CYAN}]${NC} %d%% ${WHITE}%s${NC}" $percentage "$message"
}

# Function to display status header
show_status_header() {
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    ${WHITE}ServerDash Update Manager - TEST MODE${PURPLE}                    ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Simulated backup function
backup_data_demo() {
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/demo_backup_$backup_timestamp"
    
    log "Creating demo backup at $backup_path"
    mkdir -p "$backup_path"
    
    show_progress 1 5 "Backing up database..."
    sleep 1
    echo "# Demo database backup" > "$backup_path/database_backup.sql"
    
    show_progress 2 5 "Backing up configuration..."
    sleep 1
    echo "# Demo config backup" > "$backup_path/.env"
    
    show_progress 3 5 "Backing up volumes..."
    sleep 1
    echo "Demo volume data" > "$backup_path/volume_backup.txt"
    
    show_progress 4 5 "Backing up custom files..."
    sleep 1
    
    show_progress 5 5 "Backup completed!"
    echo ""
    log "Demo backup completed successfully at $backup_path"
    echo "$backup_path"
}

# Simulated update function
update_serverdash_demo() {
    local latest_version=$1
    
    log "Starting demo ServerDash update to version $latest_version"
    
    show_progress 1 10 "Stopping services..."
    sleep 2
    
    show_progress 2 10 "Backing up current installation..."
    sleep 1
    
    show_progress 3 10 "Fetching latest code..."
    sleep 2
    
    show_progress 4 10 "Updating dependencies..."
    sleep 2
    
    show_progress 5 10 "Pulling latest Docker images..."
    sleep 2
    
    show_progress 6 10 "Building containers..."
    sleep 3
    
    show_progress 7 10 "Running database migrations..."
    sleep 2
    
    show_progress 8 10 "Starting services..."
    sleep 2
    
    show_progress 9 10 "Waiting for services to start..."
    sleep 3
    
    show_progress 10 10 "Update completed!"
    echo ""
    log "Demo ServerDash update completed successfully"
}

# Simulated verification
verify_update_demo() {
    local expected_version=$1
    
    log "Verifying demo update..."
    sleep 2
    
    echo -e "${GREEN}✓ ServerDash is running successfully${NC}"
    echo -e "${GREEN}✓ Current version: $expected_version${NC}"
    echo -e "${GREEN}✓ Update verification completed${NC}"
    log "Demo update verification successful - version: $expected_version"
    return 0
}

# Function to display final status
show_final_status() {
    local success=$1
    local current_version=$2
    local latest_version=$3
    
    echo ""
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    if [[ $success -eq 0 ]]; then
        echo -e "${PURPLE}║                      ${GREEN}DEMO UPDATE COMPLETED SUCCESSFULLY${PURPLE}                      ║${NC}"
        echo -e "${PURPLE}║                                                                                ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Updated To:    ${GREEN}$current_version${PURPLE}                                                 ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Updated From:  ${YELLOW}$latest_version${PURPLE}                                                 ║${NC}"
        echo -e "${PURPLE}║                                                                                ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}This was a demonstration of the update process!${PURPLE}                       ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}In real usage, ServerDash would be updated to the latest version.${PURPLE}     ║${NC}"
    else
        echo -e "${PURPLE}║                            ${RED}DEMO UPDATE FAILED${PURPLE}                            ║${NC}"
    fi
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Main function
main() {
    show_status_header
    log "ServerDash Update Manager TEST MODE started"
    
    echo -e "${YELLOW}🧪 DEMO MODE: Simulating an update from v0.0.3 to v0.0.4${NC}"
    echo -e "${CYAN}This demonstrates what happens when an update is available...${NC}"
    echo ""
    
    local current_version="0.0.3-Pre-Release"
    local latest_version="0.0.4-Pre-Release"
    
    echo -e "${WHITE}Current Version: ${CYAN}$current_version${NC}"
    echo -e "${WHITE}Latest Version:  ${CYAN}$latest_version${NC}"
    echo ""
    
    echo -e "${GREEN}🎉 Update available! (Demo)${NC}"
    echo -e "${YELLOW}Starting demo update process...${NC}"
    echo ""
    
    # Create backup
    echo -e "${CYAN}Step 1/3: Creating backup...${NC}"
    local backup_path=$(backup_data_demo)
    echo -e "${GREEN}✓ Demo backup created at: $backup_path${NC}"
    echo ""
    
    # Perform update
    echo -e "${CYAN}Step 2/3: Updating ServerDash...${NC}"
    update_serverdash_demo "$latest_version"
    echo -e "${GREEN}✓ Demo update process completed${NC}"
    echo ""
    
    # Verify update
    echo -e "${CYAN}Step 3/3: Verifying update...${NC}"
    if verify_update_demo "$latest_version"; then
        show_final_status 0 "$latest_version" "$current_version"
    else
        show_final_status 1 "$current_version" "$latest_version"
        exit 1
    fi
    
    echo ""
    echo -e "${WHITE}Press any key to exit demo...${NC}"
    read -n 1
}

# Check if running in screen
if [[ -n "$STY" ]]; then
    # Already in screen, run main function
    main
else
    # Not in screen, start screen session
    echo -e "${CYAN}Starting ServerDash Update Manager DEMO in screen session...${NC}"
    echo -e "${YELLOW}This will demonstrate the update process in a persistent session.${NC}"
    echo -e "${WHITE}To reattach later, use: screen -r serverdash-update-demo${NC}"
    echo ""
    sleep 3
    
    # Start screen session with status bar
    screen -S serverdash-update-demo -h 1000 bash -c "
        # Configure screen status bar
        screen -X hardstatus alwayslastline
        screen -X hardstatus string '%{= kG}ServerDash Update Demo %{= kW}%H %{= kG}[%c] [%l]'
        
        # Run the demo script
        bash '$0' main
    "
fi 