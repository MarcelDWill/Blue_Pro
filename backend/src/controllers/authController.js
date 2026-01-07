const { prisma } = require('../config/database');
const { createCustomer, authenticateCustomer, authenticateTechnician } = require('../services/authService');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/jwt');
const logger = require('../config/logger');

const registerCustomer = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, address } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      });
    }

    const customer = await createCustomer({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address
    });

    const token = generateToken({
      userId: customer.id,
      role: 'customer'
    });

    setTokenCookie(res, token);

    logger.info(`New customer registered: ${customer.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: customer,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const customer = await authenticateCustomer(email, password);

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const token = generateToken({
      userId: customer.id,
      role: 'customer'
    });

    setTokenCookie(res, token);

    logger.info(`Customer logged in: ${customer.email}`);

    res.json({
      success: true,
      data: {
        user: customer,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const loginTechnician = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const technician = await authenticateTechnician(email, password);

    if (!technician) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    if (!technician.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account has been disabled'
        }
      });
    }

    const token = generateToken({
      userId: technician.id,
      role: 'technician'
    });

    setTokenCookie(res, token);

    logger.info(`Technician logged in: ${technician.email}`);

    res.json({
      success: true,
      data: {
        user: technician,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    clearTokenCookie(res);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
        role: req.userRole
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  loginTechnician,
  logout,
  getProfile
};