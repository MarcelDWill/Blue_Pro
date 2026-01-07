const Queue = require('bull');
const createRedisClient = require('../config/redis');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const redisClient = createRedisClient();

const assignmentQueue = new Queue('appointment assignment', {
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
    ...(process.env.REDIS_URL && {
      ...require('url').parse(process.env.REDIS_URL)
    })
  }
});

const findEligibleTechnicians = async (appointment) => {
  try {
    // Extract skill IDs from appointment's requiredSkills junction table
    const appointmentSkillIds = appointment.requiredSkills.map(as => as.skillId);

    // Find technicians with matching skills and work area
    const technicians = await prisma.technician.findMany({
      where: {
        isActive: true,
        skills: {
          some: {
            skillId: { in: appointmentSkillIds }
          }
        },
        workAreas: {
          some: {
            workAreaId: appointment.workAreaId
          }
        }
      },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        workAreas: {
          include: {
            workArea: true
          }
        }
      }
    });

    const eligibleTechnicians = [];

    for (const technician of technicians) {
      const appointmentDate = new Date(appointment.scheduledDateTime);
      const dayOfWeek = appointmentDate.getDay();
      const appointmentTime = appointmentDate.toTimeString().slice(0, 5);

      // Find technician's working hours for this day
      const workingHours = await prisma.workingHours.findFirst({
        where: {
          technicianId: technician.id,
          dayOfWeek,
          isAvailable: true,
          effectiveDate: { lte: appointmentDate }
        },
        orderBy: { effectiveDate: 'desc' }
      });

      if (workingHours) {
        const startTime = workingHours.startTime;
        const endTime = workingHours.endTime;

        if (appointmentTime >= startTime && appointmentTime <= endTime) {
          // Check for conflicting appointments
          const conflictingAppointments = await prisma.serviceAppointment.count({
            where: {
              technicianId: technician.id,
              status: { in: ['assigned', 'accepted', 'in_progress'] },
              scheduledDateTime: {
                gte: new Date(appointmentDate.getTime() - (appointment.estimatedDuration * 60 * 1000)),
                lt: new Date(appointmentDate.getTime() + (appointment.estimatedDuration * 60 * 1000))
              }
            }
          });

          if (conflictingAppointments === 0) {
            // Calculate current workload
            const currentWorkload = await prisma.serviceAppointment.count({
              where: {
                technicianId: technician.id,
                status: { in: ['assigned', 'accepted', 'in_progress'] },
                scheduledDateTime: { gte: appointmentDate }
              }
            });

            // Calculate skill match count
            const technicianSkillIds = technician.skills.map(ts => ts.skillId);
            const skillMatch = appointmentSkillIds.filter(skillId =>
              technicianSkillIds.includes(skillId)
            ).length;

            // Transform junction table results for technician
            const transformedTechnician = {
              ...technician,
              skills: technician.skills.map(ts => ts.skill),
              workAreas: technician.workAreas.map(twa => twa.workArea)
            };

            eligibleTechnicians.push({
              technician: transformedTechnician,
              workload: currentWorkload,
              skillMatch
            });
          }
        }
      }
    }

    // Sort by skill match (descending) then workload (ascending)
    return eligibleTechnicians.sort((a, b) => {
      if (a.skillMatch !== b.skillMatch) {
        return b.skillMatch - a.skillMatch;
      }
      return a.workload - b.workload;
    });
  } catch (error) {
    logger.error('Error finding eligible technicians:', error);
    throw error;
  }
};

assignmentQueue.process('assignAppointment', async (job) => {
  const { appointmentId } = job.data;

  try {
    logger.info(`Processing assignment for appointment: ${appointmentId}`);

    const appointment = await prisma.serviceAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        },
        workArea: true,
        customer: {
          include: {
            address: true
          }
        }
      }
    });

    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    if (appointment.status !== 'pending') {
      logger.info(`Appointment ${appointmentId} is no longer pending, skipping assignment`);
      return;
    }

    const eligibleTechnicians = await findEligibleTechnicians(appointment);

    if (eligibleTechnicians.length === 0) {
      logger.warn(`No eligible technicians found for appointment: ${appointmentId}`);

      await prisma.serviceAppointment.update({
        where: { id: appointmentId },
        data: { status: 'pending' }
      });

      job.moveToDelayed(Date.now() + (30 * 60 * 1000));
      return;
    }

    const selectedTechnician = eligibleTechnicians[0].technician;

    const updatedAppointment = await prisma.serviceAppointment.update({
      where: { id: appointmentId },
      data: {
        technicianId: selectedTechnician.id,
        status: 'assigned',
        assignedAt: new Date()
      }
    });

    logger.info(`Appointment ${appointmentId} assigned to technician ${selectedTechnician.employeeId}`);

    await assignmentQueue.add('sendAssignmentNotification', {
      appointmentId: updatedAppointment.id,
      technicianId: selectedTechnician.id,
      customerId: appointment.customerId
    });

    return {
      appointmentId,
      technicianId: selectedTechnician.id,
      assignedAt: updatedAppointment.assignedAt
    };

  } catch (error) {
    logger.error(`Error processing assignment for appointment ${appointmentId}:`, error);
    throw error;
  }
});

assignmentQueue.process('sendAssignmentNotification', async (job) => {
  const { appointmentId, technicianId, customerId } = job.data;

  try {
    logger.info(`Sending assignment notifications for appointment: ${appointmentId}`);

    logger.info(`[MOCK] SMS notification sent to technician ${technicianId}`);
    logger.info(`[MOCK] Email notification sent to customer ${customerId}`);

    return {
      appointmentId,
      notificationsSent: ['technician_sms', 'customer_email']
    };
  } catch (error) {
    logger.error(`Error sending notifications for appointment ${appointmentId}:`, error);
    throw error;
  }
});

assignmentQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

assignmentQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err.message);
});

assignmentQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

const addAssignmentJob = async (appointmentId, delay = 0) => {
  try {
    const job = await assignmentQueue.add('assignAppointment',
      { appointmentId },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    );

    logger.info(`Assignment job added for appointment: ${appointmentId}, Job ID: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Error adding assignment job:', error);
    throw error;
  }
};

module.exports = {
  assignmentQueue,
  addAssignmentJob
};
