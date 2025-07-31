#!/bin/bash

# ServerDash Applications Setup Script
# This script prepares your system for deploying applications

set -e

echo "🚀 ServerDash Applications Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Some operations may need to be adjusted for your user."
fi

# Function to check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo "Please install Docker first:"
        echo "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install docker.io"
        echo "  CentOS/RHEL: sudo yum install docker"
        echo "  Or visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker --version &> /dev/null; then
        print_error "Docker is installed but not accessible!"
        echo "You may need to:"
        echo "  1. Start Docker service: sudo systemctl start docker"
        echo "  2. Add your user to docker group: sudo usermod -aG docker $USER"
        echo "  3. Log out and log back in"
        exit 1
    fi
    
    print_success "Docker is installed and accessible"
}

# Function to check if Docker daemon is running
check_docker_daemon() {
    print_status "Checking Docker daemon..."
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running!"
        echo "Please start Docker:"
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker  # to start on boot"
        exit 1
    fi
    
    print_success "Docker daemon is running"
}

# Function to create application directories
create_directories() {
    print_status "Creating application directories..."
    
    BASE_DIR="/opt/serverdash"
    DIRS=(
        "postgresql"
        "redis"
        "nodejs"
        "mongo"
        "grafana"
        "prometheus"
        "apache"
        "elasticsearch"
        "nextcloud"
        "portainer"
        "traefik"
        "mysql"
    )
    
    # Create base directory
    if [ ! -d "$BASE_DIR" ]; then
        sudo mkdir -p "$BASE_DIR"
        print_success "Created base directory: $BASE_DIR"
    fi
    
    # Create subdirectories
    for dir in "${DIRS[@]}"; do
        FULL_PATH="$BASE_DIR/$dir"
        if [ ! -d "$FULL_PATH" ]; then
            sudo mkdir -p "$FULL_PATH"
            print_success "Created directory: $FULL_PATH"
        fi
    done
    
    # Set permissions
    if [ "$EUID" -eq 0 ]; then
        chown -R 1000:1000 "$BASE_DIR"
    else
        sudo chown -R $USER:$USER "$BASE_DIR"
    fi
    
    chmod -R 755 "$BASE_DIR"
    print_success "Set permissions for application directories"
}

# Function to pre-pull essential Docker images
pull_images() {
    print_status "Pre-pulling essential Docker images..."
    
    IMAGES=(
        "nginx:alpine"
        "postgres:15-alpine"
        "redis:7-alpine"
        "node:18-alpine"
        "mongo:7"
        "grafana/grafana:latest"
        "prom/prometheus:latest"
        "httpd:2.4-alpine"
        "portainer/portainer-ce:latest"
        "mysql:8.0"
        "adminer:latest"
        "phpmyadmin/phpmyadmin:latest"
    )
    
    for image in "${IMAGES[@]}"; do
        print_status "Pulling $image..."
        if docker pull "$image"; then
            print_success "Successfully pulled $image"
        else
            print_warning "Failed to pull $image (will be pulled during deployment)"
        fi
    done
}

# Function to check system resources
check_resources() {
    print_status "Checking system resources..."
    
    # Check available disk space
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=5000000  # 5GB in KB
    
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        print_warning "Low disk space detected. You have $(($AVAILABLE_SPACE / 1024 / 1024))GB available."
        print_warning "Consider freeing up space before deploying many applications."
    else
        print_success "Sufficient disk space available"
    fi
    
    # Check available memory
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    REQUIRED_MEMORY=1024  # 1GB
    
    if [ "$AVAILABLE_MEMORY" -lt "$REQUIRED_MEMORY" ]; then
        print_warning "Low memory detected. You have ${AVAILABLE_MEMORY}MB available."
        print_warning "Some applications may not run properly with limited memory."
    else
        print_success "Sufficient memory available"
    fi
}

# Function to optimize Docker settings
optimize_docker() {
    print_status "Checking Docker configuration..."
    
    # Check if Docker is configured to start on boot
    if systemctl is-enabled docker &> /dev/null; then
        print_success "Docker is configured to start on boot"
    else
        print_warning "Docker is not configured to start on boot"
        echo "You can enable it with: sudo systemctl enable docker"
    fi
    
    # Check Docker storage driver
    STORAGE_DRIVER=$(docker info --format '{{.Driver}}' 2>/dev/null || echo "unknown")
    print_status "Docker storage driver: $STORAGE_DRIVER"
}

# Function to test application deployment
test_deployment() {
    print_status "Testing application deployment with hello-world..."
    
    if docker run --rm hello-world &> /dev/null; then
        print_success "Docker deployment test successful"
    else
        print_error "Docker deployment test failed"
        echo "Please check your Docker configuration"
        exit 1
    fi
}

# Function to show network information
show_network_info() {
    print_status "Network information for applications:"
    
    # Get the main IP address
    MAIN_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+' 2>/dev/null || echo "localhost")
    
    echo "  Access applications at: http://$MAIN_IP:<port>"
    echo "  Available ports configured:"
    echo "    - Nginx: 8080, 8443"
    echo "    - PostgreSQL: 5433"
    echo "    - Redis: 6380"
    echo "    - Node.js: 3001"
    echo "    - MongoDB: 27018"
    echo "    - Grafana: 3002"
    echo "    - Prometheus: 9091"
    echo "    - Apache: 8081"
    echo "    - Elasticsearch: 9201, 9301"
    echo "    - Nextcloud: 8082"
    echo "    - Portainer: 9001"
    echo "    - Traefik: 8083, 8444, 8084"
    echo "    - MySQL: 3307"
    echo "    - phpMyAdmin: 8085"
    echo "    - Adminer: 8086"
}

# Main execution
main() {
    echo ""
    print_status "Starting ServerDash Applications setup..."
    echo ""
    
    check_docker
    check_docker_daemon
    create_directories
    check_resources
    optimize_docker
    test_deployment
    
    echo ""
    print_status "Pulling Docker images (this may take a while)..."
    pull_images
    
    echo ""
    show_network_info
    
    echo ""
    print_success "🎉 ServerDash Applications setup completed successfully!"
    echo ""
    echo "You can now:"
    echo "  1. Start your ServerDash application"
    echo "  2. Navigate to the Applications section"
    echo "  3. Deploy applications from the store"
    echo ""
    echo "Note: Some applications may require additional configuration after deployment."
}

# Run setup if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 