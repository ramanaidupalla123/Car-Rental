const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdminUsers = async () => {
  try {
    console.log('🚗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define the two fixed admin users
    const adminUsers = [
      {
        name: 'Satya Ram Naidu',
        email: 'ramanaidupalla359@gmail.com',
        password: 'ramanaidu_palla_143', // Will be hashed automatically
        phone: '+91-9346551287',
        address: {
          street: 'Mutyalamma temple Street',
          city: 'Jangareddygudem',
          state: 'Andhra Pradesh',
          zipCode: '534202',
          country: 'India'
        },
        role: 'admin'
      },
      {
        name: 'Leele Sai Ram',
        email: 'nleelasairamnakka@gmail.com', 
        password: 'leelasai', // Will be hashed automatically
        phone: '+91-7981242049',
        address: {
          street: 'Temple Street',
          city: 'Ravulapalem',
          state: 'Andhra Pradesh', 
          zipCode: '500034',
          country: 'India'
        },
        role: 'admin'
      }
    ];

    console.log('👑 Seeding admin users...');

    for (const userData of adminUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        // Update existing user to ensure admin role
        existingUser.role = 'admin';
        existingUser.name = userData.name;
        existingUser.phone = userData.phone;
        existingUser.address = userData.address;
        await existingUser.save();
        console.log(`✅ Updated admin user: ${userData.email}`);
      } else {
        // Create new admin user
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created admin user: ${userData.email}`);
      }
    }

    console.log('🎉 Admin users seeding completed!');
    console.log('\n📧 Admin Login Credentials:');
    console.log('========================');
    adminUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Name: ${user.name}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔗 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedAdminUsers();