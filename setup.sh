#!/bin/bash

# =============================================================================
# ServerDash Quick Setup Script
# =============================================================================

set -e  # Exit on any error

echo "🚀 ServerDash Quick Setup"
echo "========================="
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Copy environment template
echo "📋 Copying environment template..."
if [ ! -f "environment.template" ]; then
    echo "❌ environment.template not found!"
    echo "Please make sure you're in the ServerDash directory."
    exit 1
fi

cp environment.template .env.local
echo "✅ Environment template copied to .env.local"

# Generate secure JWT secret
echo "🔐 Generating secure JWT secret..."
JWT_SECRET=$(openssl rand -base64 64)

if [ $? -eq 0 ]; then
    # Replace the JWT_SECRET in .env.local
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET=\"CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_GENERATE_WITH_OPENSSL\"/JWT_SECRET=\"$JWT_SECRET\"/" .env.local
    else
        # Linux
        sed -i "s/JWT_SECRET=\"CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_GENERATE_WITH_OPENSSL\"/JWT_SECRET=\"$JWT_SECRET\"/" .env.local
    fi
    echo "✅ Secure JWT secret generated and configured"
else
    echo "⚠️  Could not generate JWT secret automatically."
    echo "Please manually replace JWT_SECRET in .env.local with a secure random string."
    echo "You can generate one with: openssl rand -base64 64"
fi

# Check if Docker is running
echo "🐳 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker and run this script again."
    exit 1
fi
echo "✅ Docker is running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not available!"
        echo "Please install Docker Compose and run this script again."
        exit 1
    else
        COMPOSE_CMD="docker compose"
    fi
else
    COMPOSE_CMD="docker-compose"
fi
echo "✅ Docker Compose is available"

# Ask if user wants to start the services immediately
echo ""
read -p "🚀 Do you want to start ServerDash now? (Y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "⏸️  Setup complete! To start ServerDash later, run:"
    echo "   $COMPOSE_CMD up -d"
    echo ""
    echo "📖 Next steps:"
    echo "   1. Review and customize .env.local if needed"
    echo "   2. Start the services: $COMPOSE_CMD up -d"
    echo "   3. Open http://localhost:3000 in your browser"
    exit 0
fi

echo "🚀 Starting ServerDash services..."
$COMPOSE_CMD up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ServerDash is now running!"
    echo ""
    echo "📊 Dashboard: http://localhost:3000"
    echo "🗄️  Database: localhost:5432 (if DB_EXTERNAL_PORT is set)"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs:     $COMPOSE_CMD logs -f"
    echo "   Stop services: $COMPOSE_CMD down"
    echo "   Restart:       $COMPOSE_CMD restart"
    echo ""
    echo "📖 Complete the setup wizard in your browser to get started!"
else
    echo "❌ Failed to start ServerDash services."
    echo "Check the logs with: $COMPOSE_CMD logs"
    exit 1
fi 