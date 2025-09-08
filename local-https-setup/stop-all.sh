#!/bin/bash

# Script to stop all running processes and clean up

echo "Stopping all running processes..."

# Stop nginx
echo "Stopping nginx..."
sudo nginx -s stop 2>/dev/null || echo "Nginx was not running"

# Kill any running npm processes
echo "Stopping development server..."
pkill -f "npm run dev" 2>/dev/null || echo "No npm processes found"
pkill -f "nodemon" 2>/dev/null || echo "No nodemon processes found"
pkill -f "tsx" 2>/dev/null || echo "No tsx processes found"

# Kill any processes on port 3000
echo "Stopping processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# Kill any processes on port 80
echo "Stopping processes on port 80..."
lsof -ti:80 | xargs kill -9 2>/dev/null || echo "No processes found on port 80"

# Kill any processes on port 443
echo "Stopping processes on port 443..."
lsof -ti:443 | xargs kill -9 2>/dev/null || echo "No processes found on port 443"

echo "✅ All processes stopped!"
echo ""
echo "Current status:"
echo "  Port 3000: $(lsof -i:3000 2>/dev/null | wc -l | tr -d ' ') processes"
echo "  Port 80: $(lsof -i:80 2>/dev/null | wc -l | tr -d ' ') processes"
echo "  Port 443: $(lsof -i:443 2>/dev/null | wc -l | tr -d ' ') processes"
