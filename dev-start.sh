#!/bin/bash

# Development startup script for ServerDash
# Sets the correct environment variables for npm development

export DATABASE_URL="postgresql://postgres:ServerDash2024!@localhost:5434/serverdash"
export NODE_ENV="development"
export PORT=3000

echo "Starting ServerDash development server..."
echo "Database: localhost:5434"
echo "Environment: development"
echo "Port: 3000"
echo ""

npm run dev 