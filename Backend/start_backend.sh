#!/bin/bash
# ── Clinica Software Backend Startup Script ──

set -e
cd "$(dirname "$0")"

echo "🏥 Clinica Backend Startup"
echo "=========================="

# 1. Create venv if missing
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# 2. Activate venv
source .venv/bin/activate
echo "✅ Virtual environment activated"

# 3. Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# 4. Check PostgreSQL
echo ""
echo "🔗 Database URL: $(grep DATABASE_URL .env 2>/dev/null | head -1)"
echo ""

# 5. Run seed (creates tables + demo data)
echo "🌱 Seeding database..."
python seed.py 2>&1 || echo "⚠️  Seed failed (DB may not be ready — check PostgreSQL)"

# 6. Start the server
echo ""
echo "🚀 Starting FastAPI server..."
echo "   Swagger UI: http://localhost:8000/docs"
echo "   ReDoc:      http://localhost:8000/redoc"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
