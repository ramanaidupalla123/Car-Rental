const Car = require('../models/Car');

exports.getCars = async (req, res, next) => {
  try {
    const cars = await Car.find({ available: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: cars.length,
      cars
    });

  } catch (error) {
    next(error);
  }
};

exports.getCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    res.json({
      success: true,
      car
    });

  } catch (error) {
    next(error);
  }
};