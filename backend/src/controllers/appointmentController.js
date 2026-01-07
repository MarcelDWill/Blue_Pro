const { prisma } = require('../config/database');
const { scheduleAppointmentAssignment } = require('../services/appointmentService');
const logger = require('../config/logger');

const createAppointment = async (req, res, next) => {
  try {
    const {
      title,
      description,
      serviceType,
      address,
      scheduledDateTime,
      estimatedDuration,
      priority
    } = req.body;

    const workArea = await prisma.workArea.findFirst({
      where: {
        zipCodes: { has: address.zipCode },
        isActive: true
      }
    });

    if (!workArea) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SERVICE_AREA',
          message: 'Service is not available in this area'
        }
      });
    }

    const requiredSkills = await prisma.skill.findMany({
      where: {
        category: serviceType,
        isActive: true
      }
    });

    if (requiredSkills.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SKILLS_FOUND',
          message: 'No skills found for this service type'
        }
      });
    }

    // Create address first
    const createdAddress = await prisma.address.create({
      data: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        lat: address.coordinates?.lat,
        lng: address.coordinates?.lng
      }
    });

    // Create appointment with nested junction table entries
    const appointment = await prisma.serviceAppointment.create({
      data: {
        customerId: req.user.id,
        title,
        description,
        serviceType,
        workAreaId: workArea.id,
        addressId: createdAddress.id,
        scheduledDateTime: new Date(scheduledDateTime),
        estimatedDuration: estimatedDuration || 120,
        priority: priority || 'medium',
        requiredSkills: {
          create: requiredSkills.map(skill => ({ skillId: skill.id }))
        }
      },
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
        },
        address: true
      }
    });

    // Transform junction table results
    const transformedAppointment = {
      ...appointment,
      requiredSkills: appointment.requiredSkills.map(as => as.skill)
    };

    await scheduleAppointmentAssignment(appointment.id);

    logger.info(`New appointment created: ${appointment.referenceNumber}`);

    res.status(201).json({
      success: true,
      data: transformedAppointment
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { customerId: req.user.id };
    if (status) {
      where.status = status;
    }

    const [appointments, total] = await prisma.$transaction([
      prisma.serviceAppointment.findMany({
        where,
        include: {
          technician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true
            }
          },
          requiredSkills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          },
          workArea: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true
            }
          },
          address: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.serviceAppointment.count({ where })
    ]);

    // Transform junction table results
    const transformedAppointments = appointments.map(appt => ({
      ...appt,
      requiredSkills: appt.requiredSkills.map(as => as.skill)
    }));

    res.json({
      success: true,
      data: transformedAppointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.serviceAppointment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            address: true
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true
          }
        },
        requiredSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        workArea: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        },
        address: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found'
        }
      });
    }

    if (req.userRole === 'customer' && appointment.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied'
        }
      });
    }

    if (req.userRole === 'technician' &&
        (!appointment.technicianId || appointment.technicianId !== req.user.id)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied'
        }
      });
    }

    // Transform junction table results
    const transformedAppointment = {
      ...appointment,
      requiredSkills: appointment.requiredSkills.map(as => as.skill)
    };

    res.json({
      success: true,
      data: transformedAppointment
    });
  } catch (error) {
    next(error);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const appointment = await prisma.serviceAppointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found'
        }
      });
    }

    if (appointment.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied'
        }
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Feedback can only be submitted for completed appointments'
        }
      });
    }

    const updatedAppointment = await prisma.serviceAppointment.update({
      where: { id },
      data: {
        customerFeedback: {
          rating,
          comment,
          submittedAt: new Date().toISOString()
        }
      }
    });

    logger.info(`Feedback submitted for appointment: ${updatedAppointment.referenceNumber}`);

    res.json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getCustomerAppointments,
  getAppointmentById,
  submitFeedback
};
