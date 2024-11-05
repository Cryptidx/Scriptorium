#!/bin/bash

set -e

# Step 1: Install required packages in the scriptorium directory
echo "Installing npm packages in the scriptorium directory..."
cd scriptorium
npm install

# Step 2: Check for Node.js installation
if ! command -v node &> /dev/null
then
    echo "Node.js could not be found. Please install Node.js before running this script."
    exit 1
fi

# Step 3: Check for SQLite installation
if ! command -v sqlite3 &> /dev/null
then
    echo "SQLite could not be found. Please install SQLite before running this script."
    exit 1
fi

# Generate a timestamped migration name
MIGRATION_NAME="init_migration$(date +%Y%m%d_%H%M%S)"

# Step 4: Run Prisma migrations (still assuming migrations are in scriptorium)
echo "Running Prisma migrations..."
npx prisma generate
npx prisma migrate dev --name "$MIGRATION_NAME"

# Step 5: Run the script to create the admin user
echo "Creating an admin user..."
node ./startup-stuff-temp/create-sys-admin.js

echo "Startup preparation complete."
