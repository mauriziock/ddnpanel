#!/bin/sh
set -e

# Check if PUID and PGID are set
if [ -n "$PUID" ] && [ -n "$PGID" ]; then
    # Update the nextjs user's UID and GID
    # We use usermod/groupmod if they exist, or just patch /etc/passwd if minimal environment
    
    # In alpine:
    # shadow package provides usermod/groupmod
    
    # If the requested PUID is already taken by another user (e.g. node created by base image), 
    # and that user is NOT nextjs, we need to free it up.
    EXISTING_USER=$(getent passwd "$PUID" | cut -d: -f1)
    if [ -n "$EXISTING_USER" ] && [ "$EXISTING_USER" != "nextjs" ]; then
        echo "UID $PUID is already taken by $EXISTING_USER. Dealing with conflict..."
        
        # If it's the default 'node' user or similar, we can safely delete or move it
        if [ "$EXISTING_USER" = "node" ]; then
             deluser node
        else
             # For other users, move them out of the way just in case
             usermod -u 1100 "$EXISTING_USER"
        fi
    fi

    # Change group id
    if [ $(getent group nextjs | cut -d: -f3) != "$PGID" ]; then
        echo "Setting nextjs GID to $PGID"
        groupmod -g "$PGID" nextjs
    fi

    # Change user id
    if [ $(id -u nextjs) != "$PUID" ]; then
        echo "Setting nextjs UID to $PUID"
        usermod -u "$PUID" -g "$PGID" nextjs
    fi

    # Fix ownership of necessary directories
    echo "Fixing permissions..."
    mkdir -p /app/.next /app/files-storage /app/config /app/public/wallpapers
    
    chown -R nextjs:nextjs /app/.next 
    chown -R nextjs:nextjs /app/files-storage
    chown -R nextjs:nextjs /app/config
    chown -R nextjs:nextjs /app/public/wallpapers

    # Restore default wallpapers if volume is empty
    if [ -z "$(ls -A /app/public/wallpapers)" ]; then
        echo "Initializing wallpapers volume with defaults..."
        cp -r /app/wallpapers-backup/* /app/public/wallpapers/
        chown -R nextjs:nextjs /app/public/wallpapers/
    fi
    # Note: We don't chown /media or /mnt because those are host mounts
fi

# Clear terminal message
echo " "
echo "=========================================================="
echo "    🚀 CONTROL PANEL - SYSTEM READY"
echo "=========================================================="
echo "    Default Administrator Access:"
echo "    - User:      admin"
echo "    - Password:  admin"
echo " "
echo "    Password Reset Utility:"
echo "    docker exec -it controlpanel node scripts/reset-password.js <user> <pass>"
echo "=========================================================="
echo " "

# Execute command as nextjs user if running as root
if [ "$(id -u)" = "0" ]; then
    # Use su-exec to step down from root to nextjs
    exec su-exec nextjs "$@"
else
    exec "$@"
fi
