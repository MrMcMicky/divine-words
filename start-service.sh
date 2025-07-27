#!/bin/bash

# Navigate to project directory
cd /var/www/divine-words

# Kill any existing process on port 8016
lsof -ti:8016 | xargs kill -9 2>/dev/null || true

# Start the Vite preview server
npm run serve