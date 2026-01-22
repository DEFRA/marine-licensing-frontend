#!/bin/sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
USERS_DIR="$SCRIPT_DIR/../compose/users"

echo "Registering DEFRA ID stub users from $USERS_DIR"

for user_file in "$USERS_DIR"/*.json; do
  if [ -f "$user_file" ]; then
    echo "Registering: $(basename "$user_file")"
    curl -sS -H "Content-Type: application/json" -X POST -d @"$user_file" http://localhost:3200/cdp-defra-id-stub/API/register | jq
  fi
done

echo "All users registered"
