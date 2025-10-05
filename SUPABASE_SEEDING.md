# Supabase Database Seeding

This guide helps you seed your Supabase database with initial data for the PokerBoard application.

## Quick Start

### 1. Get Your Supabase Connection String

1. Go to your **Vercel project dashboard**
2. Navigate to **Settings** → **Environment Variables**
3. Copy the `DATABASE_URL` value

The connection string should look like:
```
postgresql://postgres:[password]@[host]:5432/postgres
```

### 2. Run the Seeding Script

**Option A: Direct command**
```bash
DATABASE_URL="your-supabase-connection-string" node seed-supabase.js
```

**Option B: Set environment variable**
```bash
export DATABASE_URL="your-supabase-connection-string"
node seed-supabase.js
```

**Option C: Use the helper script**
```bash
./seed-supabase.sh
```

## What Gets Created

The seeding script creates:

### 👤 Admin Users
- **Hakan Sivritepe**: `hakan@sivritepe.com` / `admin123`
- **Serkan Demirkol**: `serkan@demirkol.com` / `admin123`

### 👥 Test Players
- **Halil Zurnacı**: `halil@zurnaci.com` / `password123`
- **Murat Can**: `murat@can.com` / `password123`
- **Tolga Öz**: `tolga@oz.com` / `password123`
- **Gökhan Uzun**: `gokhan@uzun.com` / `password123`
- **Cengiz Aksu**: `cengiz@aksu.com` / `password123`
- **Tuğberk Özdemir**: `tugberk@ozdemir.com` / `password123`
- **Bülent Sezer**: `bulent@sezer.com` / `password123`
- **Armağan Uysal**: `armagan@uysal.com` / `password123`
- **Tolga Sivritepe**: `tolga@sivritepe.com` / `password123`

### 🎮 Sample Game Session
- **Session ID**: `sample-session-001`
- **Date**: September 25, 2025
- **Location**: Allsancak Tontiş Bar
- **Game Type**: No Limit Hold'em
- **Status**: COMPLETED
- **Buy-in**: ₺40,000
- **Session Cost**: ₺27,700

### 💰 Sample Transactions
- Player buy-ins and cash-outs for the sample session
- Various transaction amounts to demonstrate the system

## Troubleshooting

### Error: "User postgres was denied access"
- Make sure you're using the correct Supabase connection string
- Verify the password in the connection string is correct
- Ensure your Supabase project is active

### Error: "Connection refused"
- Check if your Supabase project is paused
- Verify the host and port in the connection string
- Make sure your IP is whitelisted in Supabase (if applicable)

### Error: "Database does not exist"
- Ensure you're using the correct database name (usually `postgres`)
- Check that your Supabase project is properly configured

## After Seeding

Once the seeding is complete:

1. **Test login** with admin credentials on your Vercel app
2. **Create new sessions** using the seeded players
3. **Test the full application flow** with real data

## Files

- `seed-supabase.js` - Main seeding script
- `seed-supabase.sh` - Helper script with instructions
- `seed-supabase.md` - This documentation file
