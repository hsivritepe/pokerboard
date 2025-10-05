#!/bin/sh
echo "Starting database migration..."
npx prisma migrate deploy
echo "Starting application..."
npm start
