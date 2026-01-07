require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../src/config/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/field_service_manager');
    logger.info('Connected to MongoDB for migrations');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    await db.collection('customers').createIndex({ email: 1 }, { unique: true });
    
    await db.collection('technicians').createIndex({ email: 1 }, { unique: true });
    await db.collection('technicians').createIndex({ employeeId: 1 }, { unique: true });
    await db.collection('technicians').createIndex({ skills: 1 });
    await db.collection('technicians').createIndex({ workAreas: 1 });
    
    await db.collection('working_hours').createIndex({ technicianId: 1, dayOfWeek: 1 });
    await db.collection('working_hours').createIndex({ effectiveDate: 1 });
    
    await db.collection('service_appointments').createIndex({ customerId: 1 });
    await db.collection('service_appointments').createIndex({ technicianId: 1 });
    await db.collection('service_appointments').createIndex({ status: 1 });
    await db.collection('service_appointments').createIndex({ scheduledDateTime: 1 });
    await db.collection('service_appointments').createIndex({ workAreaId: 1 });
    await db.collection('service_appointments').createIndex({ referenceNumber: 1 }, { unique: true });
    
    await db.collection('skills').createIndex({ name: 1 }, { unique: true });
    await db.collection('skills').createIndex({ category: 1 });
    
    await db.collection('work_areas').createIndex({ zipCodes: 1 });
    await db.collection('work_areas').createIndex({ 'coordinates.center': '2dsphere' });
    await db.collection('work_areas').createIndex({ city: 1, state: 1 });

    logger.info('All indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    await connectDB();
    
    logger.info('Starting database migrations...');
    
    await createIndexes();
    
    logger.info('Database migrations completed successfully!');
  } catch (error) {
    logger.error('Error running migrations:', error);
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };