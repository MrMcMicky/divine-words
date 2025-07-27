#!/bin/bash

# Kill any existing process
pkill -f "node server.js" 2>/dev/null

# Wait a moment
sleep 2

# Start the service with automatic restart on failure
while true; do
    echo "[$(date)] Starting Divine Words service..."
    npm run serve
    echo "[$(date)] Service crashed, restarting in 5 seconds..."
    sleep 5
done