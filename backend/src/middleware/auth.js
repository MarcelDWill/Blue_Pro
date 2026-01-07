const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === 'customer') {
      user = await prisma.customer.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          addressId: true,
          createdAt: true,
          updatedAt: true,
          address: true
        }
      });
    } else if (decoded.role === 'technician') {
      const technician = await prisma.technician.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          employeeId: true,
          hourlyRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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

      // Transform junction table results to flat arrays
      if (technician) {
        user = {
          ...technician,
          skills: technician.skills.map(ts => ts.skill),
          workAreas: technician.workAreas.map(twa => twa.workArea)
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired'
        }
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.userRole !== role) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. ${role} role required`
        }
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};