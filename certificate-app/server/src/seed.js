const { connectDB, sequelize } = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

const seedUser = async () => {
    try {
        await connectDB();
        
        const username = 'admin@cookscape.com';
        const password = 'behappy@123';

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            console.log('User already exists');
            process.exit(0);
        }

        await User.create({
            username,
            password
        });

        console.log('Admin user created successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedUser();
