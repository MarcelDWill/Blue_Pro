const { addAssignmentJob } = require('../queues/assignmentQueue');
const logger = require('../config/logger');

const scheduleAppointmentAssignment = async (appointmentId) => {
  try {
    const delay = 5 * 1000;
    
    await addAssignmentJob(appointmentId, delay);
    
    logger.info(`Assignment scheduled for appointment: ${appointmentId} with ${delay}ms delay`);
  } catch (error) {
    logger.error('Error scheduling appointment assignment:', error);
    throw error;
  }
};

const rescheduleAppointmentAssignment = async (appointmentId, delay = 30 * 60 * 1000) => {
  try {
    await addAssignmentJob(appointmentId, delay);
    
    logger.info(`Assignment rescheduled for appointment: ${appointmentId} with ${delay}ms delay`);
  } catch (error) {
    logger.error('Error rescheduling appointment assignment:', error);
    throw error;
  }
};

module.exports = {
  scheduleAppointmentAssignment,
  rescheduleAppointmentAssignment
};