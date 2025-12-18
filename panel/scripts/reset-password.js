const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(process.cwd(), 'config', 'users.json');

async function resetPassword() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node scripts/reset-password.js <username> <new_password>');
        process.exit(1);
    }

    const [username, newPassword] = args;

    if (!fs.existsSync(USERS_FILE)) {
        console.error('Error: users.json not found in config/ directory.');
        process.exit(1);
    }

    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        let users = JSON.parse(data);

        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            console.error(`Error: User "${username}" not found.`);
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        users[userIndex].password = hashedPassword;

        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

        console.log('--------------------------------------------------');
        console.log(`✅ Success: Password for user "${username}" has been reset.`);
        console.log('--------------------------------------------------');
    } catch (error) {
        console.error('An error occurred:', error.message);
        process.exit(1);
    }
}

resetPassword();
