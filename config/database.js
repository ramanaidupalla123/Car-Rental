const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔗 Attempting MongoDB Atlas connection...');
    
    // Log connection details (without password)
    const connStr = process.env.MONGODB_URI;
    const safeConnStr = connStr ? connStr.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:****@') : 'Not set';
    console.log('🔐 Connection:', safeConnStr);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // 15 seconds
      socketTimeoutMS: 20000, // 20 seconds
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
    
  } catch (error) {
    console.error('❌ MONGODB CONNECTION FAILED:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n🎯 SPECIFIC ISSUE: Cannot reach MongoDB Atlas servers');
      console.log('🔧 Possible causes:');
      console.log('   • Internet connection issues');
      console.log('   • DNS resolution problems');
      console.log('   • Firewall blocking connection');
      console.log('   • MongoDB Atlas cluster down');
      console.log('   • IP not whitelisted in Atlas');
    }
    
    if (error.message.includes('bad auth')) {
      console.log('\n🎯 SPECIFIC ISSUE: Authentication failed');
      console.log('🔧 Check: Username and password in connection string');
    }
    
    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.log('\n🎯 SPECIFIC ISSUE: DNS SRV record lookup failed');
      console.log('🔧 Solutions:');
      console.log('   • Try using mobile hotspot');
      console.log('   • Restart router');
      console.log('   • Use Google DNS (8.8.8.8)');
      console.log('   • Wait and try again later');
    }
    
    // Don't exit in development - allow nodemon to keep running
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error; // Re-throw to be handled by server.js
  }
};

// Connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⏹️  Database connection closed');
  process.exit(0);
});

module.exports = connectDB;