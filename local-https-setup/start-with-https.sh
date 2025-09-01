#!/bin/bash

# Script to start application with HTTPS support using nginx reverse proxy
# This provides both HTTP and HTTPS access without port numbers

echo "Starting application with HTTPS support..."

# Set the domain configuration for HTTPS access
export APP_BASE_URL=https://marine-licensing-frontend.test.cdp-int.defra.cloud

# Check if SSL certificates exist
if [ ! -f "./local-https-setup/marine-licensing-frontend.test.cdp-int.defra.cloud.pem" ] || [ ! -f "./local-https-setup/marine-licensing-frontend.test.cdp-int.defra.cloud-key.pem" ]; then
    echo "SSL certificates not found. Creating them..."
    cd local-https-setup
    mkcert marine-licensing-frontend.test.cdp-int.defra.cloud
    cd ..
fi

# Start nginx with HTTPS config
echo "Starting nginx with HTTPS..."
sudo nginx -c $(pwd)/local-https-setup/nginx-https.conf

# Start the development server in the background
echo "Starting development server..."
npm run dev:debug &
DEV_PID=$!

# Wait for the server to start
sleep 5

echo "Setup complete!"
echo "Access your application at:"
echo "  HTTP:  http://marine-licensing-frontend.test.cdp-int.defra.cloud"
echo "  HTTPS: https://marine-licensing-frontend.test.cdp-int.defra.cloud"
echo ""
echo "Press Ctrl+C to stop both nginx and the development server"

# Wait for user to stop
wait $DEV_PID

# Cleanup
echo "Stopping nginx..."
sudo nginx -s stop
echo "Stopping development server..."
kill $DEV_PID
