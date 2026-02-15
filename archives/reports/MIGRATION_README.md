# Customer Migration Script

## Setup

1. **Install dependencies** (if not already installed):
```bash
npm install @supabase/supabase-js
```

2. **Set environment variables**:

Create a `.env` file in the root directory or export these variables:

```bash
export VITE_SUPABASE_URL="your_supabase_url"
export VITE_SUPABASE_SERVICE_KEY="your_service_role_key"
export BUSINESS_ID="your_business_uuid"
```

Or edit the script directly and replace:
- `YOUR_SUPABASE_URL` with your Supabase project URL
- `YOUR_SERVICE_KEY` with your Supabase service role key
- `YOUR_BUSINESS_UUID_HERE` with your business UUID

## Run Migration

```bash
node run_migration.js
```

## What it does

1. Reads `import_customers.csv` from the root directory
2. For each customer, calls the Supabase RPC function `migrate_club_members_v2`
3. Passes the following parameters:
   - `p_phone`: Phone number from CSV
   - `p_name`: Customer name from CSV
   - `p_added_coffees`: Number of coffee purchases
   - `p_added_free`: Number of free coffees earned
   - `p_business_id`: Your business UUID

## Output

The script will show:
- Progress for each customer (e.g., `[1/450] Migrating: itay (0526205190)`)
- Success/failure status for each migration
- Final summary with total successful and failed migrations

## Troubleshooting

If you get errors:
1. Make sure the RPC function `migrate_club_members_v2` exists in your Supabase database
2. Verify your service role key has the correct permissions
3. Check that the CSV file is in the correct location
4. Ensure phone numbers are formatted correctly (10 digits starting with 05)
