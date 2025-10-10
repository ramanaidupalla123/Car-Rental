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
        features: ['AC', 'Power Steering', 'Music System', 'Airbags', 'Power Windows'],
        images: [{ 
          url: 'https://www.popularmaruti.com/blog/wp-content/uploads/2023/07/How-the-Maruti-Suzuki-Swift-Adapts-the-Lifestyle-of-Indian-Automobile-Enthusiasts.jpg', 
          alt: 'Maruti Suzuki Swift 2024' 
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
        features: ['AC', 'Power Steering', 'Touchscreen', 'Rear Camera', 'Apple CarPlay'],
        images: [{ 
          url: 'https://www.carblogindia.com/wp-content/uploads/2017/05/2017-maruti-dzire-review-images-4.jpg', 
          alt: 'Maruti Suzuki Dzire 2024' 
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
        features: ['AC', 'Power Steering', 'Bluetooth', 'Rear AC', 'Captain Seats'],
        images: [{ 
          url: 'https://sribalajitravels.co/wp-content/uploads/2024/12/ERTIGA-e1737835789946.jpg', 
          alt: 'Maruti Suzuki Ertiga 2024' 
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
        features: ['AC', 'Sunroof', 'Touchscreen', 'Rear Camera', 'Apple CarPlay', 'Ventilated Seats'],
        images: [{ 
          url: 'https://stimg.cardekho.com/images/carexteriorimages/930x620/Hyundai/Creta/7695/1651645683867/front-left-side-47.jpg', 
          alt: 'Hyundai Creta 2024' 
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
        features: ['AC', 'Touchscreen', 'Rear Camera', 'Sunroof', 'Wireless Charging'],
        images: [{ 
          url: 'https://www.usnews.com/object/image/00000191-ebcd-d396-a1ff-fbdf35860001/01-usnpx-2025hyundaivenue-angularfront-jms.jpg?update-time=1726238473076&size=responsiveGallery&format=webp', 
          alt: 'Hyundai Venue 2024' 
        }],
        available: true,
        color: 'Grey',
        mileage: '18 kmpl',
        registrationNumber: 'TS09IJ7890'
      },

      // Toyota Cars - FIXED: Both Toyota cars included
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
        features: ['AC', 'Leather Seats', 'Touchscreen', 'Rear AC', 'Sunroof', 'Premium Audio'],
        images: [{ 
          url: 'https://imgd.aeplcdn.com/1920x1080/n/cw/ec/140809/innova-crysta-exterior-right-front-three-quarter-2.png?isig=0&q=80&q=80', 
          alt: 'Toyota Innova Crysta 2024' 
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
        features: ['AC', 'Leather Seats', 'Sunroof', 'GPS', '4x4', '360 Camera'],
        images: [{ 
          url: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/44709/fortuner-exterior-left-front-three-quarter.jpeg?q=80', 
          alt: 'Toyota Fortuner 2024' 
        }],
        available: true,
        color: 'White',
        mileage: '10 kmpl',
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
        features: ['4x4', 'AC', 'Music System', 'Sunroof', 'Off-road', 'LED Lights'],
        images: [{ 
          url: 'https://motoringworld.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-5.43.04-PM.png', 
          alt: 'Mahindra Thar 2024' 
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
        features: ['AC', 'Power Steering', 'Music System', 'Airbags', 'Touchscreen', 'Rear Camera'],
        images: [{ 
          url: 'https://imgd-ct.aeplcdn.com/1056x594/n/cw/ec/40432/scorpio-n-exterior-right-front-three-quarter-75.jpeg?isig=0&q=80', 
          alt: 'Mahindra Scorpio 2024' 
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

    // Verify all cars were added
    const count = await Car.countDocuments();
    console.log(`📊 Total cars in database: ${count}`);

    // Display added cars
    console.log('\n🚗 Added Cars:');
    cars.forEach((car, index) => {
      console.log(`   ${index + 1}. ${car.make} ${car.model} - ${car.type}`);
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