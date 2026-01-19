#!/bin/sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

curl -sS -H "Content-Type: application/json" -X POST -d @"$SCRIPT_DIR"/users/some-org-emp-1.json http://localhost:3200/cdp-defra-id-stub/API/register | jq
curl -sS -H "Content-Type: application/json" -X POST -d @"$SCRIPT_DIR"/users/some-org-emp-2.json http://localhost:3200/cdp-defra-id-stub/API/register | jq
curl -sS -H "Content-Type: application/json" -X POST -d @"$SCRIPT_DIR"/users/some-individual-1.json http://localhost:3200/cdp-defra-id-stub/API/register | jq
curl -sS -H "Content-Type: application/json" -X POST -d @"$SCRIPT_DIR"/users/some-agent-1.json http://localhost:3200/cdp-defra-id-stub/API/register | jq
