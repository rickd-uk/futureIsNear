#!/bin/bash

# Configurable variables
USER="rick"
SERVER="139.162.81.209"
PORT="2222"
KEY_PATH="/home/rick/.ssh/LINODE"
REMOTE_DIR="/var/www/test.futureisnear.xyz"

# Start SSH agent and add your key
eval $(ssh-agent -s)
ssh-add $KEY_PATH

# Ensure local build is up-to-date
echo "Building project locally..."
if ! npm run build; then
    echo "ERROR: Build failed. Please fix the issues and try again."
    ssh-agent -k
    exit 1
fi

# Create a temporary directory for the updated files
TEMP_DIR=$(mktemp -d)
cp -r .next package.json package-lock.json prisma $TEMP_DIR/

echo "Copying updated files to the server..."
# Sync only updated files to the server
rsync -avz -e "ssh -p $PORT -i $KEY_PATH" --delete \
    $TEMP_DIR/ \
    $USER@$SERVER:$REMOTE_DIR/

# Update the server application
echo "Updating server application..."
ssh -t -p $PORT -i $KEY_PATH $USER@$SERVER "cd $REMOTE_DIR && \
    npm install --production && \
    npx prisma generate --schema=prisma/schema.prisma && \
    pm2 restart futureisnear-test --update-env && \
    pm2 save"

# Clean up the temporary directory
rm -rf $TEMP_DIR

# Kill SSH agent
ssh-agent -k

echo "Update completed successfully!"

