#!/bin/sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

curl -H "Content-Type: application/json" -X POST -d @"$SCRIPT_DIR"/users/some-org-emp-1.json http://localhost:3200/cdp-defra-id-stub/API/register | jq
curl -H "Content-Type: application/json" -X POST -d @"$SCRIPT_DIR"/users/some-org-emp-2.json http://localhost:3200/cdp-defra-id-stub/API/register | jq
