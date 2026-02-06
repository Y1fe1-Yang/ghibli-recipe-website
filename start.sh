#!/bin/bash
cd "$(dirname "$0")"

# Kill existing server
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2

# Start server with environment variable
AI_GATEWAY_API_KEY="$AI_GATEWAY_API_KEY" node server/index.js > /tmp/ghibli-server.log 2>&1 &

echo "Server started on port 3000"
echo "Logs: tail -f /tmp/ghibli-server.log"
