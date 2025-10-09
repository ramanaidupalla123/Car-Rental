const mongoose = require('mongoose');
require('dotenv').config();

const verifyImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Car = require('./models/Car');
    const cars = await Car.find({});
    
    console.log(`\n📊 Verifying ${cars.length} car images:\n`);
    
    cars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   🖼️  Image URL: ${car.images[0].url}`);
      console.log(`   ✅ Image Status: ${car.images[0].url ? 'PRESENT' : 'MISSING'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔗 Connection closed');
  }
};

verifyImages();