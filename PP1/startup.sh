#!/bin/bash

# Run with ./startup.sh
# Special thanks to GPT

set -e

# Step 1: Install required packages in the scriptorium directory
echo "Installing npm packages in the scriptorium directory..."
cd scriptorium
npm install

# Function to compare version numbers
version_ge() {
    [ "$1" = "$2" ] && return 0
    local IFS=.
    local i ver1=($1) ver2=($2)
    for ((i=0; i<${#ver1[@]}; i++)); do
        if ((10#${ver1[i]} > 10#${ver2[i]:-0})); then return 0; fi
        if ((10#${ver1[i]} < 10#${ver2[i]:-0})); then return 1; fi
    done
    return 0
}

# Step 2: Check for Node.js installation and version
if ! command -v node &> /dev/null; then
    echo "Node.js could not be found. Please install Node.js before running this script."
    exit 1
else
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_NODE_VERSION="20.0"
    if ! version_ge "$NODE_VERSION" "$REQUIRED_NODE_VERSION"; then
        echo "Node.js version 20 or higher is required. Found version $NODE_VERSION."
        exit 1
    fi
fi

# Step 3: Check for Python installation and version
if ! command -v python3 &> /dev/null; then
    echo "Python3 could not be found. Please install Python3 to continue."
    exit 1
else
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    REQUIRED_PYTHON_VERSION="3.10"
    if ! version_ge "$PYTHON_VERSION" "$REQUIRED_PYTHON_VERSION"; then
        echo "Python 3.10 or higher is required. Found version $PYTHON_VERSION."
        exit 1
    fi
fi

# Step 4: Check for GCC installation and version
if ! command -v gcc &> /dev/null; then
    echo "GCC (C compiler) could not be found. Please install GCC to continue."
    exit 1
else
    GCC_VERSION=$(gcc -dumpversion | cut -d. -f1)
    REQUIRED_GCC_VERSION="12"
    if ! version_ge "$GCC_VERSION" "$REQUIRED_GCC_VERSION"; then
        echo "GCC version 12 or higher is required. Found version $GCC_VERSION."
        exit 1
    fi
fi

# Step 5: Check for G++ installation and version
if ! command -v g++ &> /dev/null; then
    echo "G++ (C++ compiler) could not be found. Please install G++ to continue."
    exit 1
else
    GPP_VERSION=$(g++ -dumpversion | cut -d. -f1)
    REQUIRED_GPP_VERSION="12"
    if ! version_ge "$GPP_VERSION" "$REQUIRED_GPP_VERSION"; then
        echo "G++ version 12 or higher is required. Found version $GPP_VERSION."
        exit 1
    fi
fi

# Step 6: Check for Java installation and version
if ! command -v javac &> /dev/null; then
    echo "Java compiler (javac) could not be found. Please install the Java JDK to continue."
    exit 1
else
    JAVA_VERSION=$(javac -version 2>&1 | awk '{print $2}')
    REQUIRED_JAVA_VERSION="20"
    if ! version_ge "$JAVA_VERSION" "$REQUIRED_JAVA_VERSION"; then
        echo "Java version 20 or higher is required. Found version $JAVA_VERSION."
        exit 1
    fi
fi

# Step 7: Check for SQLite installation
if ! command -v sqlite3 &> /dev/null; then
    echo "SQLite could not be found. Please install SQLite before running this script."
    exit 1
fi

# Generate a timestamped migration name
MIGRATION_NAME="init_migration$(date +%Y%m%d_%H%M%S)"

# Step 8: Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma generate
npx prisma migrate dev --name "$MIGRATION_NAME"

# Step 9: Run the script to create the admin user
echo "Creating an admin user..."
node ./startup-stuff-temp/create-sys-admin.js

echo "Startup preparation complete."
