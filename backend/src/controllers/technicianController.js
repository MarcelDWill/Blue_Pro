const { prisma } = require('../config/database');
const logger = require('../config/logger');

const getAvailableJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, priority, serviceType } = req.query;
    const skip = (page - 1) * limit;

    const technicianSkillIds = req.user.skills.map(skill => skill.id);
    const technicianWorkAreaIds = req.user.workAreas.map(area => area.id);

    const where = {
      status: 'pending',
      requiredSkills: {
        some: {
          skillId: { in: technicianSkillIds }
        }
      },
      workAreaId: { in: technicianWorkAreaIds },
      scheduledDateTime: { gt: new Date() }
    };

    if (priority) {
      where.priority = priority;
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

    const [jobs, total] = await prisma.$transaction([
      prisma.serviceAppointment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              address: true
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
        orderBy: [
          { scheduledDateTime: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.serviceAppointment.count({ where })
    ]);

    // Transform junction table results and apply priority sorting
    const transformedJobs = jobs.map(job => ({
      ...job,
      requiredSkills: job.requiredSkills.map(as => as.skill),
      customerId: job.customer
    })).sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime);
    });

    res.json({
      success: true,
      data: transformedJobs,
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

const acceptJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.serviceAppointment.findUnique({
      where: { id },
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        }
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

    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Appointment is no longer available'
        }
      });
    }

    const technicianSkillIds = req.user.skills.map(skill => skill.id);
    const requiredSkillIds = appointment.requiredSkills.map(as => as.skillId);

    const hasRequiredSkills = requiredSkillIds.some(skillId =>
      technicianSkillIds.includes(skillId)
    );

    if (!hasRequiredSkills) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_SKILLS',
          message: 'You do not have the required skills for this job'
        }
      });
    }

    const technicianWorkAreaIds = req.user.workAreas.map(area => area.id);

    if (!technicianWorkAreaIds.includes(appointment.workAreaId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OUTSIDE_WORK_AREA',
          message: 'This job is outside your assigned work areas'
        }
      });
    }

    const updatedAppointment = await prisma.serviceAppointment.update({
      where: { id },
      data: {
        technicianId: req.user.id,
        status: 'accepted',
        acceptedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            address: true
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

    // Transform junction table results
    const transformedAppointment = {
      ...updatedAppointment,
      requiredSkills: updatedAppointment.requiredSkills.map(as => as.skill),
      customerId: updatedAppointment.customer,
      workAreaId: updatedAppointment.workArea
    };

    logger.info(`Job accepted by technician ${req.user.employeeId}: ${updatedAppointment.referenceNumber}`);

    res.json({
      success: true,
      data: transformedAppointment
    });
  } catch (error) {
    next(error);
  }
};

const getMyJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { technicianId: req.user.id };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['accepted', 'in_progress', 'completed'] };
    }

    const [jobs, total] = await prisma.$transaction([
      prisma.serviceAppointment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              address: true
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
        orderBy: { scheduledDateTime: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.serviceAppointment.count({ where })
    ]);

    // Transform junction table results
    const transformedJobs = jobs.map(job => ({
      ...job,
      requiredSkills: job.requiredSkills.map(as => as.skill),
      customerId: job.customer,
      workAreaId: job.workArea
    }));

    res.json({
      success: true,
      data: transformedJobs,
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

const updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, completionNotes } = req.body;

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

    if (!appointment.technicianId || appointment.technicianId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You are not assigned to this job'
        }
      });
    }

    const validTransitions = {
      accepted: ['in_progress'],
      in_progress: ['completed']
    };

    if (!validTransitions[appointment.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot change status from ${appointment.status} to ${status}`
        }
      });
    }

    const updateData = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (completionNotes) {
        updateData.completionNotes = completionNotes;
      }
    }

    const updatedAppointment = await prisma.serviceAppointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            address: true
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

    // Transform junction table results
    const transformedAppointment = {
      ...updatedAppointment,
      requiredSkills: updatedAppointment.requiredSkills.map(as => as.skill),
      customerId: updatedAppointment.customer,
      workAreaId: updatedAppointment.workArea
    };

    logger.info(`Job status updated to ${status}: ${updatedAppointment.referenceNumber}`);

    res.json({
      success: true,
      data: transformedAppointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableJobs,
  acceptJob,
  getMyJobs,
  updateJobStatus
};
