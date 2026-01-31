# Supabase Setup Guide

This application now supports Supabase for real-time data synchronization and persistent storage.

## Prerequisites

1. A Supabase account and project
2. Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

The Supabase client is already installed. If you need to reinstall:

```bash
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://wicufyfrkaigjhirdgeu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY3VmeWZya2FpZ2poaXJkZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODMzMjcsImV4cCI6MjA4NTQ1OTMyN30.lqKJho15EnaohIhEtAq2TeISYhHHQvX-LdV9d9SETAc
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY3VmeWZya2FpZ2poaXJkZ2V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg4MzMyNywiZXhwIjoyMDg1NDU5MzI3fQ.-GWmadYW3QcaxuvYKDAfwgV0x8LRkl31knrejdV7JP4
```

**Note:** The `.env` file is already in `.gitignore` to protect your credentials.

### 3. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase-schema.sql`:

```sql
-- This creates the tables table and sets up the necessary indexes and triggers
```

The schema includes:
- A `tables` table to store restaurant table sessions
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp updates
- Default table initialization (Table_01 to Table_10)

### 4. Configure Row Level Security (RLS)

The default policy allows all operations. For production, you should:

1. Go to Authentication > Policies in Supabase dashboard
2. Create more restrictive policies based on your needs
3. Consider adding authentication if needed

### 5. Start the Application

```bash
npm run dev
```

## How It Works

### Automatic Fallback

The application automatically:
- Uses Supabase if environment variables are configured
- Falls back to localStorage if Supabase is not available
- Syncs data in real-time when Supabase is enabled

### Real-time Updates

When Supabase is enabled:
- Changes to table sessions are synced across all connected clients
- Updates happen in real-time using Supabase's real-time subscriptions
- Data persists across page refreshes

### Data Structure

Each table session is stored with:
- `table_id`: Unique identifier (e.g., "Table_01")
- `is_locked`: Whether the table session is locked
- `is_vip`: Whether it's a VIP table
- `cart`: JSON array of cart items
- `requests`: JSON array of table requests
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Troubleshooting

### Supabase Connection Issues

1. Verify your environment variables are correct
2. Check that your Supabase project is active
3. Ensure the database schema has been created
4. Check browser console for error messages

### Data Not Syncing

1. Check Supabase dashboard for connection status
2. Verify RLS policies allow the operations
3. Check browser console for errors
4. Ensure real-time is enabled in your Supabase project

### Fallback to LocalStorage

If Supabase is not configured or unavailable, the app will automatically use localStorage. This ensures the app works even without a database connection.

## Security Notes

⚠️ **Important Security Considerations:**

1. The `.env` file should never be committed to version control
2. The anon key is safe to use in client-side code
3. The service role key should only be used server-side
4. For production, implement proper RLS policies
5. Consider adding authentication for multi-user scenarios

## Next Steps

- Add authentication for staff/admin users
- Implement more granular RLS policies
- Add database backups
- Set up monitoring and alerts
