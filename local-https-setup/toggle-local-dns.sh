#!/bin/bash

# Script to toggle local DNS entry for marine-licensing-frontend.test.cdp-int.defra.cloud
# This allows you to easily switch between local development and remote test environment

HOSTS_FILE="/etc/hosts"
DOMAIN="marine-licensing-frontend.test.cdp-int.defra.cloud"
LOCAL_IP="127.0.0.1"

# Check current status
if grep -q "^#127.0.0.1 $DOMAIN" "$HOSTS_FILE"; then
    echo "Local DNS is currently DISABLED (will resolve to test environment)"
    echo "Enabling local DNS..."
    sudo sed -i '' "s/^#127.0.0.1 $DOMAIN/127.0.0.1 $DOMAIN/" "$HOSTS_FILE"
    echo "✅ Local DNS ENABLED - domain will resolve to localhost"
elif grep -q "^127.0.0.1 $DOMAIN" "$HOSTS_FILE"; then
    echo "Local DNS is currently ENABLED (will resolve to localhost)"
    echo "Disabling local DNS..."
    sudo sed -i '' "s/^127.0.0.1 $DOMAIN/#127.0.0.1 $DOMAIN/" "$HOSTS_FILE"
    echo "✅ Local DNS DISABLED - domain will resolve to test environment"
else
    echo "Local DNS entry for $DOMAIN not found. Adding it as ENABLED."
    echo "$LOCAL_IP $DOMAIN" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "✅ Local DNS ENABLED - domain will resolve to localhost"
fi

echo "Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
echo "✅ DNS cache flushed."

# Verify current status
echo ""
echo "Current /etc/hosts entry for $DOMAIN:"
grep "$DOMAIN" "$HOSTS_FILE"
echo ""
echo "Current DNS resolution for $DOMAIN:"
nslookup "$DOMAIN" | grep "Address"
