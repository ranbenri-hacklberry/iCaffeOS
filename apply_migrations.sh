#!/bin/bash
export PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin
MIGRATIONS_DIR="/Users/icaffeos/icaffeos/frontend_source/supabase/migrations"
DB_CONTAINER="supabase_db_scarlet-zodiac"

echo "🐘 Applying migrations to $DB_CONTAINER..."

# Check if migrations dir exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Error: Migrations directory not found at $MIGRATIONS_DIR"
    exit 1
fi

# Run base schema first
if [ -f "$MIGRATIONS_DIR/20230101000000_base_schema.sql" ]; then
    echo "Running base schema..."
    cat "$MIGRATIONS_DIR/20230101000000_base_schema.sql" | docker exec -i -u postgres $DB_CONTAINER psql -d postgres -q
fi

# Run everything else in order
for f in $(ls $MIGRATIONS_DIR/*.sql | sort); do
    if [[ "$f" == *"base_schema"* ]]; then continue; fi
    echo "Applying $(basename $f)..."
    cat "$f" | docker exec -i -u postgres $DB_CONTAINER psql -d postgres -q >/dev/null 2>&1
done

echo "✅ All migrations applied!"
