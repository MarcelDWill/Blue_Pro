const { prisma } = require('../config/database');

/**
 * Validate working hours - ensure start time is before end time
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @throws {Error} If start time is not before end time
 */
const validateWorkingHours = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    throw new Error('Start time must be before end time');
  }
};

/**
 * Create working hours for a technician with validation
 * @param {Object} workingHoursData - Working hours data
 * @returns {Promise<Object>} Created working hours record
 */
const createWorkingHours = async (workingHoursData) => {
  // Validate time range
  validateWorkingHours(workingHoursData.startTime, workingHoursData.endTime);

  const workingHours = await prisma.workingHours.create({
    data: workingHoursData,
    include: {
      technician: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      },
    },
  });

  return workingHours;
};

/**
 * Update working hours with validation
 * @param {string} id - Working hours ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated working hours record
 */
const updateWorkingHours = async (id, updateData) => {
  // Validate time range if times are being updated
  if (updateData.startTime || updateData.endTime) {
    const existing = await prisma.workingHours.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Working hours not found');
    }

    const startTime = updateData.startTime || existing.startTime;
    const endTime = updateData.endTime || existing.endTime;

    validateWorkingHours(startTime, endTime);
  }

  const workingHours = await prisma.workingHours.update({
    where: { id },
    data: updateData,
    include: {
      technician: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
        },
      },
    },
  });

  return workingHours;
};

module.exports = {
  validateWorkingHours,
  createWorkingHours,
  updateWorkingHours,
};
