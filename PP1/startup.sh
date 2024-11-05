#!/bin/bash

# example script from gpt, NOT TESTED YET 

# Exit if any command fails
set -e

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

# Step 5: Seed the database with an admin user
echo "Creating an admin user..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin_password" # Replace with a secure password and document it in your docs

# Insert the admin user into the database using Prisma
npx prisma db seed --preview-feature <<EOF
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: '${ADMIN_USERNAME}' },
    update: {},
    create: {
      username: '${ADMIN_USERNAME}',
      password: '${ADMIN_PASSWORD}', // Use hashed password if possible
      role: 'SYS_ADMIN',
    },
  });
  console.log("Admin user created:", admin);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
EOF

echo "Startup preparation complete."
