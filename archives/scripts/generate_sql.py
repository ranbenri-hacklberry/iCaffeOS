#!/usr/bin/env python3
"""
Generate SQL migration script from CSV
Usage: python3 generate_sql.py > migrate_customers_full.sql
"""

import csv

# Read CSV and generate SQL
print("""-- Customer Migration Script for Supabase SQL Editor
-- Generated automatically from import_customers.csv
-- 
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_BUSINESS_UUID_HERE' with your actual business UUID
-- 2. Copy this entire script
-- 3. Go to Supabase Dashboard > SQL Editor > New Query
-- 4. Paste and run

DO $$
DECLARE
    v_business_id UUID := 'YOUR_BUSINESS_UUID_HERE'; -- REPLACE THIS!
    v_success_count INT := 0;
    v_error_count INT := 0;
    v_customer_id UUID;
BEGIN
    RAISE NOTICE 'Starting customer migration...';
    RAISE NOTICE 'Business ID: %', v_business_id;
    RAISE NOTICE '';
""")

with open('import_customers.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row['שם פרטי'].replace("'", "''")  # Escape single quotes
        phone = row['טלפון']
        coffees = row['רכישות קפה']
        free = row['זכאות לקפה חינם']
        
        print(f"""    -- {name}
    BEGIN
        SELECT migrate_club_members_v2('{phone}', '{name}', {coffees}, {free}, v_business_id) INTO v_customer_id;
        v_success_count := v_success_count + 1;
        RAISE NOTICE '[%] ✓ {name} ({phone})', v_success_count;
    EXCEPTION WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        RAISE NOTICE '[ERROR] ✗ {name} ({phone}): %', SQLERRM;
    END;
""")

print("""
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Successful: %', v_success_count;
    RAISE NOTICE 'Failed: %', v_error_count;
    RAISE NOTICE 'Total: %', v_success_count + v_error_count;
    RAISE NOTICE '========================================';
END $$;
""")
