#!/bin/bash

# Configuration
MOUNT_POINT="/mnt/music_ssd"
# Assuming the label of the partition is 'MusicSSD'. 
# Adjust this to match the actual label or UUID of the partition.
DISK_LABEL="MusicSSD" 
USER_NAME="icaffe" # The user running the electron app

echo "🎵 Setting up Music SSD for N150..."

# 1. Create mount point
if [ ! -d "$MOUNT_POINT" ]; then
    echo "📂 Creating directory $MOUNT_POINT..."
    sudo mkdir -p "$MOUNT_POINT"
else
    echo "✅ Directory $MOUNT_POINT already exists."
fi

# 2. Add to /etc/fstab for persistent mount with nofail
if grep -q "$MOUNT_POINT" /etc/fstab; then
    echo "✅ Entry for $MOUNT_POINT already exists in /etc/fstab."
else
    echo "📝 Adding entry to /etc/fstab..."
    # We use UUID if possible, but for this script we'll use LABEL for readability.
    # Ideally: UUID=xxxx-xxxx /mnt/music_ssd auto defaults,nofail 0 2
    # Fallback to LABEL or /dev/disk/by-label/
    
    # Check if we can find the UUID
    UUID=$(lsblk -no UUID -o LABEL,UUID | grep "$DISK_LABEL" | awk '{print $2}')
    
    if [ -n "$UUID" ]; then
        echo "Found UUID: $UUID"
        echo "UUID=$UUID $MOUNT_POINT auto defaults,nofail,x-systemd.device-timeout=5s 0 2" | sudo tee -a /etc/fstab
    else
        echo "⚠️  Could not find disk with label '$DISK_LABEL'. Using placeholder in fstab."
        echo "# TODO: Replace UUID_HERE with actual UUID of the drive" | sudo tee -a /etc/fstab
        echo "# UUID=UUID_HERE $MOUNT_POINT auto defaults,nofail,x-systemd.device-timeout=5s 0 2" | sudo tee -a /etc/fstab
        echo "Please edit /etc/fstab manually to set the correct UUID."
    fi
fi

# 3. Set permissions
echo "Current user: $USER"
TARGET_USER=${1:-$USER_NAME}

echo "🔐 Setting ownership to $TARGET_USER..."
sudo chown -R $TARGET_USER:$TARGET_USER "$MOUNT_POINT"
sudo chmod -R 755 "$MOUNT_POINT"

echo "✅ Setup complete! Please validte /etc/fstab."
