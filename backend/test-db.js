// test.js
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔗 Testing MongoDB Atlas connection...');
  console.log('Connection URL:', process.env.MONGODB_URI);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🏠 Host:', mongoose.connection.host);
    
    // Check if we can read collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ ERROR: Connection failed!');
    console.error('Error message:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your .env file has correct MONGODB_URI');
    console.log('2. Verify your MongoDB Atlas username/password');
    console.log('3. Check if your IP is whitelisted in Atlas');
    console.log('4. Ensure the database name is correct');
  }
}

testConnection();