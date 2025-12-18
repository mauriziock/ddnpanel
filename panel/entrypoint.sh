#!/bin/sh
set -e

# Check if PUID and PGID are set
if [ -n "$PUID" ] && [ -n "$PGID" ]; then
    # Update the nextjs user's UID and GID
    # We use usermod/groupmod if they exist, or just patch /etc/passwd if minimal environment
    
    # In alpine:
    # shadow package provides usermod/groupmod
    
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
    chown -R nextjs:nextjs /app/.next 
    chown -R nextjs:nextjs /app/files-storage
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
