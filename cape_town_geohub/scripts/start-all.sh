#!/bin/bash

# Start GeoHub Full Stack (Dev Mode)
# Usage: ./scripts/start-all.sh

echo "🌍 Starting Backend (Uvicorn)..."
# We assume venv is activated or we use the python executable from the venv if it exists
if [ -d ".venv" ]; then
    PYTHON_EXEC=".venv/bin/python"
elif [ -d "venv" ]; then
    PYTHON_EXEC="venv/bin/python"
else
    PYTHON_EXEC="python"
fi

# Run backend in background
$PYTHON_EXEC -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✅ Backend started with PID $BACKEND_PID"

echo "🎨 Starting Frontend (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo "✅ Frontend started with PID $FRONTEND_PID"

echo "🚀 GeoHub Dev Stack Running!"
echo "   - Backend: http://localhost:8000"
echo "   - Frontend: http://localhost:5173"
echo "   (Press CTRL+C to stop)"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Wait indefinitely
wait $BACKEND_PID $FRONTEND_PID
