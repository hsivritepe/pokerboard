#!/bin/sh
echo "Starting database migration..."
npx prisma migrate deploy
echo "Seeding database..."
npx prisma db seed
echo "Starting application..."
npm start
