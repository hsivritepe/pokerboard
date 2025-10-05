#!/bin/bash

# Supabase Database Seeding Helper Script
# This script helps you seed your Supabase database

echo "🌱 Supabase Database Seeding Helper"
echo "=================================="
echo ""

echo "📋 To seed your Supabase database, you need to:"
echo ""
echo "1. Get your Supabase DATABASE_URL from Vercel:"
echo "   - Go to your Vercel project dashboard"
echo "   - Go to Settings → Environment Variables"
echo "   - Copy the DATABASE_URL value"
echo ""
echo "2. Run the seeding script with your DATABASE_URL:"
echo "   DATABASE_URL=\"your-supabase-connection-string\" node seed-supabase.js"
echo ""
echo "3. Alternative: Set the environment variable and run:"
echo "   export DATABASE_URL=\"your-supabase-connection-string\""
echo "   node seed-supabase.js"
echo ""
echo "🔑 After seeding, you can login with:"
echo "   - hakan@sivritepe.com / admin123"
echo "   - serkan@demirkol.com / admin123"
echo ""
echo "💡 The DATABASE_URL should look like:"
echo "   postgresql://postgres:[password]@[host]:5432/postgres"
echo ""

# Check if DATABASE_URL is already set
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set. Running seed script..."
    echo ""
    node seed-supabase.js
else
    echo "❌ DATABASE_URL not set. Please set it first."
    echo ""
    echo "Example:"
    echo "export DATABASE_URL=\"postgresql://postgres:yourpassword@db.yourproject.supabase.co:5432/postgres\""
    echo "node seed-supabase.js"
fi
