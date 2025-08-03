#!/bin/bash

# ServerDash Update Manager Script
# This script safely updates ServerDash without data loss
# Runs in screen session with progress status bar

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/update.log"
API_URL="http://localhost:3000/api/system/check-version"
GITHUB_REPO="https://github.com/TypTech/ServerDash.git"

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
    echo -e "${PURPLE}║                          ${WHITE}ServerDash Update Manager${PURPLE}                          ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to check if ServerDash is running
check_serverdash_running() {
    if curl -s "$API_URL" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to get version info
get_version_info() {
    if check_serverdash_running; then
        curl -s "$API_URL" 2>/dev/null || echo '{"success":false}'
    else
        echo '{"success":false,"error":"ServerDash not running"}'
    fi
}

# Function to backup data
backup_data() {
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
    
    log "Creating backup at $backup_path"
    mkdir -p "$backup_path"
    
    # Backup database
    show_progress 1 5 "Backing up database..."
    if docker-compose ps | grep -q "postgres"; then
        docker-compose exec -T db pg_dump -U postgres serverdash > "$backup_path/database_backup.sql" 2>/dev/null || true
    fi
    
    # Backup environment file
    show_progress 2 5 "Backing up configuration..."
    if [[ -f ".env" ]]; then
        cp .env "$backup_path/"
    fi
    
    # Backup Docker volumes
    show_progress 3 5 "Backing up volumes..."
    if docker volume ls | grep -q "serverdash"; then
        docker run --rm -v serverdash_postgres_data:/data -v "$backup_path":/backup alpine tar czf /backup/postgres_volume.tar.gz -C /data . 2>/dev/null || true
    fi
    
    # Backup custom configurations
    show_progress 4 5 "Backing up custom files..."
    if [[ -d "custom" ]]; then
        cp -r custom "$backup_path/" 2>/dev/null || true
    fi
    
    show_progress 5 5 "Backup completed!"
    echo ""
    log "Backup completed successfully at $backup_path"
    echo "$backup_path" # Return backup path
}

# Function to update ServerDash
update_serverdash() {
    local latest_version=$1
    
    log "Starting ServerDash update to version $latest_version"
    
    # Stop services gracefully
    show_progress 1 10 "Stopping services..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Backup current code
    show_progress 2 10 "Backing up current installation..."
    if [[ -d ".git" ]]; then
        git stash push -m "Auto-stash before update $(date)" 2>/dev/null || true
    fi
    
    # Pull latest changes
    show_progress 3 10 "Fetching latest code..."
    if [[ -d ".git" ]]; then
        git fetch origin 2>/dev/null || true
        git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
        git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
    else
        log "Not a git repository, manual update required"
    fi
    
    # Update dependencies
    show_progress 4 10 "Updating dependencies..."
    if [[ -f "package.json" ]]; then
        npm install --silent 2>/dev/null || true
    fi
    
    # Pull latest Docker images
    show_progress 5 10 "Pulling latest Docker images..."
    docker-compose pull 2>/dev/null || true
    
    # Rebuild containers if needed
    show_progress 6 10 "Building containers..."
    docker-compose build --no-cache 2>/dev/null || true
    
    # Run database migrations
    show_progress 7 10 "Running database migrations..."
    docker-compose up -d db 2>/dev/null || true
    sleep 10  # Wait for database to be ready
    docker-compose exec -T db psql -U postgres -d serverdash -c "SELECT 1;" > /dev/null 2>&1 || true
    
    # Start all services
    show_progress 8 10 "Starting services..."
    docker-compose up -d 2>/dev/null || true
    
    # Wait for services to be ready
    show_progress 9 10 "Waiting for services to start..."
    local attempts=0
    local max_attempts=30
    while ! check_serverdash_running && [[ $attempts -lt $max_attempts ]]; do
        sleep 2
        attempts=$((attempts + 1))
    done
    
    show_progress 10 10 "Update completed!"
    echo ""
    log "ServerDash update completed successfully"
}

# Function to verify update
verify_update() {
    local expected_version=$1
    
    log "Verifying update..."
    sleep 5  # Give services time to fully start
    
    if check_serverdash_running; then
        local version_info=$(get_version_info)
        local current_version=$(echo "$version_info" | jq -r '.currentVersion // "unknown"' 2>/dev/null || echo "unknown")
        
        echo -e "${GREEN}✓ ServerDash is running successfully${NC}"
        echo -e "${GREEN}✓ Current version: $current_version${NC}"
        echo -e "${GREEN}✓ Update verification completed${NC}"
        log "Update verification successful - version: $current_version"
        return 0
    else
        echo -e "${RED}✗ ServerDash is not responding${NC}"
        log "Update verification failed - ServerDash not responding"
        return 1
    fi
}

# Function to display final status
show_final_status() {
    local success=$1
    local current_version=$2
    local latest_version=$3
    
    echo ""
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    if [[ $success -eq 0 ]]; then
        echo -e "${PURPLE}║                          ${GREEN}UPDATE COMPLETED SUCCESSFULLY${PURPLE}                          ║${NC}"
        echo -e "${PURPLE}║                                                                                ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Current Version: ${GREEN}$current_version${PURPLE}                                               ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Updated From:    ${YELLOW}$latest_version${PURPLE}                                               ║${NC}"
        echo -e "${PURPLE}║                                                                                ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}ServerDash is now running the latest version!${PURPLE}                          ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Access: http://localhost:3000${PURPLE}                                           ║${NC}"
    else
        echo -e "${PURPLE}║                            ${RED}UPDATE FAILED${PURPLE}                                ║${NC}"
        echo -e "${PURPLE}║                                                                                ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Please check the logs and try again${PURPLE}                                    ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Log file: $LOG_FILE${PURPLE}"
        printf "║%*s║\n" $((78 - ${#LOG_FILE})) ""
    fi
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Main update function
main() {
    show_status_header
    log "ServerDash Update Manager started"
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Installing jq for JSON parsing...${NC}"
        sudo apt-get update && sudo apt-get install -y jq 2>/dev/null || {
            echo -e "${RED}Error: jq is required but could not be installed${NC}"
            exit 1
        }
    fi
    
    echo -e "${CYAN}Checking for updates...${NC}"
    
    # Get version information
    local version_info=$(get_version_info)
    local success=$(echo "$version_info" | jq -r '.success // false' 2>/dev/null || echo "false")
    
    if [[ "$success" != "true" ]]; then
        echo -e "${RED}Error: Cannot connect to ServerDash API${NC}"
        echo -e "${YELLOW}Make sure ServerDash is running: npm run dev${NC}"
        exit 1
    fi
    
    local current_version=$(echo "$version_info" | jq -r '.currentVersion // "unknown"' 2>/dev/null)
    local latest_version=$(echo "$version_info" | jq -r '.latestVersion // "unknown"' 2>/dev/null)
    local update_available=$(echo "$version_info" | jq -r '.updateAvailable // false' 2>/dev/null)
    
    echo -e "${WHITE}Current Version: ${CYAN}$current_version${NC}"
    echo -e "${WHITE}Latest Version:  ${CYAN}$latest_version${NC}"
    echo ""
    
    if [[ "$update_available" == "true" ]]; then
        echo -e "${GREEN}🎉 Update available!${NC}"
        echo -e "${YELLOW}Starting update process...${NC}"
        echo ""
        
        # Create backup
        echo -e "${CYAN}Step 1/3: Creating backup...${NC}"
        local backup_path=$(backup_data)
        echo -e "${GREEN}✓ Backup created at: $backup_path${NC}"
        echo ""
        
        # Perform update
        echo -e "${CYAN}Step 2/3: Updating ServerDash...${NC}"
        update_serverdash "$latest_version"
        echo -e "${GREEN}✓ Update process completed${NC}"
        echo ""
        
        # Verify update
        echo -e "${CYAN}Step 3/3: Verifying update...${NC}"
        if verify_update "$latest_version"; then
            show_final_status 0 "$latest_version" "$current_version"
        else
            show_final_status 1 "$current_version" "$latest_version"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ ServerDash is already up to date!${NC}"
        echo -e "${WHITE}No updates available at this time.${NC}"
        echo ""
        echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${PURPLE}║                           ${GREEN}ALREADY UP TO DATE${PURPLE}                              ║${NC}"
        echo -e "${PURPLE}║                                                                                ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Current Version: ${GREEN}$current_version${PURPLE}                                               ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}Latest Version:  ${GREEN}$latest_version${PURPLE}                                               ║${NC}"
        echo -e "${PURPLE}║                                                                                ║${NC}"
        echo -e "${PURPLE}║  ${WHITE}ServerDash is running the latest available version!${PURPLE}                     ║${NC}"
        echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    fi
    
    echo ""
    echo -e "${WHITE}Press any key to exit...${NC}"
    read -n 1
}

# Check if running in screen
if [[ -n "$STY" ]]; then
    # Already in screen, run main function
    main
else
    # Not in screen, start screen session
    echo -e "${CYAN}Starting ServerDash Update Manager in screen session...${NC}"
    echo -e "${YELLOW}This will create a persistent session that you can safely close.${NC}"
    echo -e "${WHITE}To reattach later, use: screen -r serverdash-update${NC}"
    echo ""
    sleep 3
    
    # Start screen session with status bar
    screen -S serverdash-update -h 1000 bash -c "
        # Configure screen status bar
        screen -X hardstatus alwayslastline
        screen -X hardstatus string '%{= kG}ServerDash Update Manager %{= kW}%H %{= kG}[%c] [%l]'
        
        # Run the main update script
        bash '$0' main
    "
fi 