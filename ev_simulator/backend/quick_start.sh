#!/bin/bash
# Quick Start Guide for the Backend

echo "🚀 EV Charging Simulator Backend - Quick Start"
echo "=============================================="
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    exit 1
fi

cd backend

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Error: Python not found. Please install Python 3.9+"
    exit 1
fi

echo "✓ Python found"

# Check dependencies
echo ""
echo "Checking dependencies..."
python -m pip list | grep -q fastapi && echo "✓ FastAPI installed" || echo "❌ FastAPI not installed"
python -m pip list | grep -q uvicorn && echo "✓ Uvicorn installed" || echo "❌ Uvicorn not installed"
python -m pip list | grep -q pydantic && echo "✓ Pydantic installed" || echo "❌ Pydantic not installed"

# Run syntax check
echo ""
echo "Running syntax validation..."
python -m py_compile main.py schemas.py simulator.py routes/simulation.py routes/health.py routes/data.py
if [ $? -eq 0 ]; then
    echo "✓ All Python files are syntactically correct"
else
    echo "❌ Syntax errors found"
    exit 1
fi

# Check imports
echo ""
echo "Checking module imports..."
python -c "from main import app; print('✓ Backend app initialized successfully')"
if [ $? -eq 0 ]; then
    echo "✓ All imports working correctly"
else
    echo "❌ Import errors found"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ Backend is ready to start!"
echo ""
echo "To start the backend, run:"
echo "  python main.py"
echo ""
echo "Then the API will be available at:"
echo "  http://localhost:8000"
echo ""
echo "Interactive API documentation:"
echo "  http://localhost:8000/docs"
echo ""
echo "To run tests:"
echo "  python test_api.py"
echo "=============================================="
