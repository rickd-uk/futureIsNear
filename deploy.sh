#!/bin/bash
set -e  # Exit on error

# Configuration variables
USER="rick"
SERVER="139.162.81.209"
PORT="2222"
KEY_PATH="/home/rick/.ssh/LINODE"
REMOTE_DIR="/var/www/test.futureisnear.xyz"
APP_NAME="futureisnear-test"

# Required files
REQUIRED_FILES=(".next" "package.json" "package-lock.json" "prisma" "next.config.ts")

# Function to check for required files
check_required_files() {
   for file in "${REQUIRED_FILES[@]}"; do
       if [ ! -e "$file" ]; then
           echo "Error: Required file/directory '$file' not found"
           exit 1
       fi
   done
}

# Function for error handling
handle_error() {
   echo "Error occurred in deployment script at line $1"
   ssh-agent -k
   exit 1
}

trap 'handle_error ${LINENO}' ERR

echo "Starting deployment process..."

# Check for required files
check_required_files

# Start SSH agent and add key
eval $(ssh-agent -s)
if ! ssh-add "$KEY_PATH"; then
   echo "Error: Failed to add SSH key"
   exit 1
fi

# Build the application
echo "Building application..."
npm run build

# Create and populate temporary directory
TEMP_DIR=$(mktemp -d)
echo "Creating temporary directory: $TEMP_DIR"
cp -r "${REQUIRED_FILES[@]}" "$TEMP_DIR/"

# Create ecosystem.config.cjs from .env
echo "Creating ecosystem.config.cjs from .env..."
cat > "$TEMP_DIR/ecosystem.config.cjs" << EOL
module.exports = {
  apps: [{
    name: 'futureisnear-test',
    script: 'npm',
    args: 'start',
    env: {
       NODE_ENV: 'production',
$(cat .env | grep -v '^#' | grep '=' | sed 's/^/      /' | sed 's/"//g' | sed 's/=/: "/' | sed 's/$/",/')
    }    
  }]
}
EOL

# Setup remote directory
echo "Setting up remote directory..."
ssh -p "$PORT" -i "$KEY_PATH" "$USER@$SERVER" "\
   mkdir -p $REMOTE_DIR"

# Sync files
echo "Copying files to server..."
rsync -avz --delete \
   -e "ssh -p $PORT -i $KEY_PATH" \
   --exclude 'node_modules' \
   --exclude '.git' \
   "$TEMP_DIR/" \
   "$USER@$SERVER:$REMOTE_DIR/"

# Remote deployment steps
echo "Running deployment on server..."
ssh -p "$PORT" -i "$KEY_PATH" "$USER@$SERVER" "cd $REMOTE_DIR && \
    echo 'Setting permissions...' && \
    chmod -R 755 . && \
    echo 'Installing dependencies...' && \
    npm install --production && \
    echo 'Generating Prisma client...' && \
    npx prisma generate && \
    echo 'Running database migrations...' && \
    npx prisma migrate deploy --skip-generate || true && \
    echo 'Configuring PM2...' && \
    if pm2 describe $APP_NAME > /dev/null 2>&1; then
        pm2 delete $APP_NAME
    fi && \
    pm2 start ecosystem.config.cjs && \
    pm2 save"




# Cleanup
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
ssh-agent -k

echo "✅ Deployment completed successfully!"
