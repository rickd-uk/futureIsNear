#!/bin/bash

# Define the range of ports to check
START_PORT=3000
END_PORT=3010

echo "Checking ports $START_PORT to $END_PORT for active processes..."

# Loop through the ports and identify processes
for PORT in $(seq $START_PORT $END_PORT); do
    PID=$(sudo lsof -t -iTCP:$PORT -sTCP:LISTEN)
    if [ -n "$PID" ]; then
        echo "Port $PORT is in use by process $PID. Terminating..."
        sudo kill -9 $PID
    else
        echo "Port $PORT is free."
    fi
done

echo "All ports in the range are now free."

# Start the Next.js development server
echo "Starting Next.js development server..."
PORT=3000 npm run dev

