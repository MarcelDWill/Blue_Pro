const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');

/**
 * Hash a password using bcrypt with 12 salt rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Create a new customer with hashed password
 * @param {Object} customerData - Customer data including password
 * @returns {Promise<Object>} Created customer without password
 */
const createCustomer = async (customerData) => {
  const { password, address, ...rest } = customerData;
  const hashedPassword = await hashPassword(password);

  // Create address first
  const createdAddress = await prisma.address.create({
    data: {
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      lat: address.coordinates?.lat,
      lng: address.coordinates?.lng,
    },
  });

  // Create customer with address relation
  const customer = await prisma.customer.create({
    data: {
      ...rest,
      password: hashedPassword,
      addressId: createdAddress.id,
    },
    include: {
      address: true,
    },
  });

  // Remove password from response
  const { password: _, ...customerWithoutPassword } = customer;
  return customerWithoutPassword;
};

/**
 * Create a new technician with hashed password
 * @param {Object} technicianData - Technician data including password
 * @returns {Promise<Object>} Created technician without password
 */
const createTechnician = async (technicianData) => {
  const { password, skills, workAreas, ...rest } = technicianData;
  const hashedPassword = await hashPassword(password);

  const technician = await prisma.technician.create({
    data: {
      ...rest,
      password: hashedPassword,
      ...(skills && {
        skills: {
          create: skills.map(skillId => ({ skillId })),
        },
      }),
      ...(workAreas && {
        workAreas: {
          create: workAreas.map(workAreaId => ({ workAreaId })),
        },
      }),
    },
    include: {
      skills: {
        include: { skill: true },
      },
      workAreas: {
        include: { workArea: true },
      },
    },
  });

  // Transform junction table results to flat arrays
  const transformedTechnician = {
    ...technician,
    skills: technician.skills.map(ts => ts.skill),
    workAreas: technician.workAreas.map(twa => twa.workArea),
  };

  // Remove password from response
  const { password: _, ...technicianWithoutPassword } = transformedTechnician;
  return technicianWithoutPassword;
};

/**
 * Authenticate a customer by email and password
 * @param {string} email - Customer email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} Customer without password if authenticated, null otherwise
 */
const authenticateCustomer = async (email, password) => {
  const customer = await prisma.customer.findUnique({
    where: { email },
    include: { address: true },
  });

  if (!customer) {
    return null;
  }

  const isValid = await comparePassword(password, customer.password);
  if (!isValid) {
    return null;
  }

  // Remove password from response
  const { password: _, ...customerWithoutPassword } = customer;
  return customerWithoutPassword;
};

/**
 * Authenticate a technician by email and password
 * @param {string} email - Technician email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} Technician without password if authenticated, null otherwise
 */
const authenticateTechnician = async (email, password) => {
  const technician = await prisma.technician.findUnique({
    where: { email },
    include: {
      skills: {
        include: { skill: true },
      },
      workAreas: {
        include: { workArea: true },
      },
    },
  });

  if (!technician) {
    return null;
  }

  const isValid = await comparePassword(password, technician.password);
  if (!isValid) {
    return null;
  }

  // Transform junction table results to flat arrays
  const transformedTechnician = {
    ...technician,
    skills: technician.skills.map(ts => ts.skill),
    workAreas: technician.workAreas.map(twa => twa.workArea),
  };

  // Remove password from response
  const { password: _, ...technicianWithoutPassword } = transformedTechnician;
  return technicianWithoutPassword;
};

module.exports = {
  hashPassword,
  comparePassword,
  createCustomer,
  createTechnician,
  authenticateCustomer,
  authenticateTechnician,
};
