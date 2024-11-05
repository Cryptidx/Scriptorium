#!/bin/bash

# Exit if any command fails
set -e

# Set the directory of this script as the base path
BASE_DIR="$(dirname "$0")"

# Step 1: Install required packages
echo "Installing npm packages..."
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

# Step 4: Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Step 5: Run the script to create the admin user
echo "Creating an admin user..."
node "$BASE_DIR/scriptorium/startup-stuff-temp/create-sys-admin.js"

echo "Startup preparation complete."
