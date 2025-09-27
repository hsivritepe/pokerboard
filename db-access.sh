#!/bin/bash

echo "🔗 Connecting to PokerBoard Database..."
echo "=================================="

# Function to run SQL queries
run_query() {
    docker exec pokerboard-db-1 psql -U postgres -d pokerboard -c "$1"
}

echo "📊 Recent Sessions:"
run_query "SELECT id, date, location, status, \"sessionCost\" FROM \"GameSession\" WHERE status = 'COMPLETED' ORDER BY \"createdAt\" DESC LIMIT 5;"

echo ""
echo "👥 Players in Latest Session:"
run_query "SELECT ps.\"userId\", u.name, u.email, ps.\"initialBuyIn\", ps.\"currentStack\", ps.status FROM \"PlayerSession\" ps JOIN \"User\" u ON ps.\"userId\" = u.id WHERE ps.\"sessionId\" = (SELECT id FROM \"GameSession\" WHERE status = 'COMPLETED' ORDER BY \"createdAt\" DESC LIMIT 1);"

echo ""
echo "💳 Transactions in Latest Session:"
run_query "SELECT t.\"playerSessionId\", u.name, t.type, t.amount, t.\"createdAt\" FROM \"Transaction\" t JOIN \"PlayerSession\" ps ON t.\"playerSessionId\" = ps.id JOIN \"User\" u ON ps.\"userId\" = u.id WHERE ps.\"sessionId\" = (SELECT id FROM \"GameSession\" WHERE status = 'COMPLETED' ORDER BY \"createdAt\" DESC LIMIT 1) ORDER BY t.\"createdAt\";"

echo ""
echo "🎯 Interactive Database Access:"
echo "Run: docker exec -it pokerboard-db-1 psql -U postgres -d pokerboard"
