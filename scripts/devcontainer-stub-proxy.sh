#!/usr/bin/env bash
# Forwards localhost:3200 inside the dev container to the Defra ID stub on the Docker host.
# Required when using npm run dev in a dev container with docker-outside-of-docker.

set -e

if pgrep -f "socat TCP-LISTEN:3200" >/dev/null 2>&1; then
  exit 0
fi

stub_host="172.17.0.1"
if getent hosts host.docker.internal >/dev/null 2>&1; then
  stub_host="host.docker.internal"
fi

socat "TCP-LISTEN:3200,fork,reuseaddr" "TCP:${stub_host}:3200" &
