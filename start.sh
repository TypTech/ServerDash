#!/bin/bash

# =============================================================================
# ServerDash Start Script
# Properly loads environment variables and starts services
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting ServerDash..."
echo "========================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please run ./setup.sh first to create the environment file."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker and run this script again."
    exit 1
fi

echo "📋 Loading environment variables from .env.local..."

# Export environment variables from .env.local
export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)

echo "🐳 Starting Docker Compose services..."

# Start the services
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ServerDash is starting up!"
    echo ""
    echo "📊 Dashboard: http://localhost:${WEB_EXTERNAL_PORT:-3000}"
    echo "🗄️  Database: localhost:${DB_EXTERNAL_PORT:-5434}"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart:       docker-compose restart"
    echo "   Status:        docker-compose ps"
    echo ""
    echo "⏳ Services are starting... Please wait a moment for initialization."
    echo "📖 Once ready, open the dashboard to complete the setup wizard!"
else
    echo "❌ Failed to start ServerDash services."
    echo "Check the logs with: docker-compose logs"
    exit 1
fi 