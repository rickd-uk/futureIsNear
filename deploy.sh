#!/bin/bash

# Replace these variables with your actual values
USER="rick"
SERVER="139.162.81.209"
PORT="2222"
KEY_PATH="/home/rick/.ssh/LINODE"
REMOTE_DIR="/var/www/test.futureisnear.xyz"

# Start SSH agent and add your key
eval $(ssh-agent -s)
ssh-add $KEY_PATH

# Ensure .next directory exists
npm run build

# Create a temporary directory for the deployment package
TEMP_DIR=$(mktemp -d)
cp -r .env .next package.json package-lock.json public prisma next.config.ts $TEMP_DIR/

echo "Setting up remote directory and permissions..."
ssh -t -p $PORT -i $KEY_PATH $USER@$SERVER "sudo bash -c '\
    mkdir -p $REMOTE_DIR && \
    chown -R $USER:$USER $REMOTE_DIR && \
    chmod -R 755 $REMOTE_DIR'"

echo "Copying files to server..."
rsync -avz -e "ssh -p $PORT -i $KEY_PATH" --delete \
    $TEMP_DIR/ \
    $USER@$SERVER:$REMOTE_DIR/

echo "Setting permissions and installing dependencies..."
ssh -t -p $PORT -i $KEY_PATH $USER@$SERVER "cd $REMOTE_DIR && \
    sudo chown -R $USER:$USER . && \
    sudo chmod -R 755 . && \
    npm install --production && \
    npx prisma generate && \
    npx prisma migrate deploy && \
    pm2 describe futureisnear-test > /dev/null 2>&1 || pm2 start npm --name 'futureisnear-test' -- start && \
    pm2 restart futureisnear-test --update-env && \
    pm2 save"

# Clean up temporary directory
rm -rf $TEMP_DIR

# Kill SSH agent
ssh-agent -k

echo "Deployment completed!"

