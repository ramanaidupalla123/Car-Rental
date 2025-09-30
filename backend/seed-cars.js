const mongoose = require('mongoose');
const Car = require('./models/Car');
require('dotenv').config();

const seedCars = async () => {
  try {
    console.log('🚗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing cars
    await Car.deleteMany({});
    console.log('🗑️ Cleared existing cars');

    const cars = [
      // Maruti Suzuki Cars
      {
        make: 'Maruti Suzuki',
        model: 'Swift',
        year: 2024,
        type: 'Hatchback',
        pricePerDay: 1200,
        pricePerHour: 150,
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        features: ['AC', 'Power Steering', 'Music System', 'Airbags'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Maruti Suzuki Swift' 
        }],
        available: true,
        color: 'Red',
        mileage: '22 kmpl',
        registrationNumber: 'TS09AB1234'
      },
      {
        make: 'Maruti Suzuki',
        model: 'Dzire',
        year: 2024,
        type: 'Sedan',
        pricePerDay: 1400,
        pricePerHour: 180,
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        features: ['AC', 'Power Steering', 'Touchscreen', 'Rear Camera'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Maruti Suzuki Dzire' 
        }],
        available: true,
        color: 'Silver',
        mileage: '24 kmpl',
        registrationNumber: 'TS09CD5678'
      },
      {
        make: 'Maruti Suzuki',
        model: 'Ertiga',
        year: 2024,
        type: 'MPV',
        pricePerDay: 1800,
        pricePerHour: 220,
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 7,
        features: ['AC', 'Power Steering', 'Bluetooth', 'Rear AC'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Maruti Suzuki Ertiga' 
        }],
        available: true,
        color: 'Blue',
        mileage: '20 kmpl',
        registrationNumber: 'TS09EF9012'
      },

      // Hyundai Cars
      {
        make: 'Hyundai',
        model: 'Creta',
        year: 2024,
        type: 'SUV',
        pricePerDay: 2800,
        pricePerHour: 320,
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        features: ['AC', 'Sunroof', 'Touchscreen', 'Rear Camera', 'Apple CarPlay'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Hyundai Creta' 
        }],
        available: true,
        color: 'White',
        mileage: '16 kmpl',
        registrationNumber: 'TS09GH3456'
      },
      {
        make: 'Hyundai',
        model: 'Venue',
        year: 2024,
        type: 'SUV',
        pricePerDay: 2200,
        pricePerHour: 280,
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        features: ['AC', 'Touchscreen', 'Rear Camera', 'Sunroof'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Hyundai Venue' 
        }],
        available: true,
        color: 'Grey',
        mileage: '18 kmpl',
        registrationNumber: 'TS09IJ7890'
      },

      // Toyota Cars
      {
        make: 'Toyota',
        model: 'Innova Crysta',
        year: 2024,
        type: 'MPV',
        pricePerDay: 3000,
        pricePerHour: 350,
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 8,
        features: ['AC', 'Leather Seats', 'Touchscreen', 'Rear AC', 'Sunroof'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Toyota Innova Crysta' 
        }],
        available: true,
        color: 'Silver',
        mileage: '13 kmpl',
        registrationNumber: 'TS09KL1357'
      },
      {
        make: 'Toyota',
        model: 'Fortuner',
        year: 2024,
        type: 'SUV',
        pricePerDay: 3500,
        pricePerHour: 400,
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 7,
        features: ['AC', 'Leather Seats', 'Sunroof', 'GPS', '4x4'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Toyota Fortuner' 
        }],
        available: true,
        color: 'White',
        mileage: '12 kmpl',
        registrationNumber: 'TS09MN2468'
      },

      // Mahindra Cars
      {
        make: 'Mahindra',
        model: 'Thar',
        year: 2024,
        type: 'SUV',
        pricePerDay: 2500,
        pricePerHour: 300,
        fuelType: 'Diesel',
        transmission: 'Manual',
        seats: 4,
        features: ['4x4', 'AC', 'Music System', 'Sunroof', 'Off-road'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Mahindra Thar' 
        }],
        available: true,
        color: 'Black',
        mileage: '15 kmpl',
        registrationNumber: 'TS09OP3579'
      },
      {
        make: 'Mahindra',
        model: 'Scorpio',
        year: 2024,
        type: 'SUV',
        pricePerDay: 2200,
        pricePerHour: 280,
        fuelType: 'Diesel',
        transmission: 'Manual',
        seats: 7,
        features: ['AC', 'Power Steering', 'Music System', 'Airbags'],
        images: [{ 
          url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
          alt: 'Mahindra Scorpio' 
        }],
        available: true,
        color: 'Grey',
        mileage: '14 kmpl',
        registrationNumber: 'TS09QR4680'
      }
    ];

    // Insert cars
    await Car.insertMany(cars);
    console.log(`✅ Added ${cars.length} cars to database`);

    // Display added cars
    console.log('\n🚗 Added Cars:');
    cars.forEach(car => {
      console.log(`   - ${car.make} ${car.model} (₹${car.pricePerDay}/day)`);
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
seedCars();