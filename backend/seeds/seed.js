require('dotenv').config();
const { prisma } = require('../src/config/database');
const { hashPassword } = require('../src/services/authService');
const logger = require('../src/config/logger');

const clearDatabase = async () => {
  try {
    // Delete in correct order due to foreign key constraints
    await prisma.appointmentSkill.deleteMany({});
    await prisma.technicianSkill.deleteMany({});
    await prisma.technicianWorkArea.deleteMany({});
    await prisma.workingHours.deleteMany({});
    await prisma.serviceAppointment.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.technician.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.workArea.deleteMany({});
    await prisma.address.deleteMany({});

    logger.info('Database cleared');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
};

const seedSkills = async () => {
  const skills = [
    { name: 'Basic Plumbing', category: 'plumbing', description: 'Faucet repair, pipe maintenance', isActive: true },
    { name: 'Advanced Plumbing', category: 'plumbing', description: 'Sewer line, water heater installation', isActive: true },
    { name: 'Residential Electrical', category: 'electrical', description: 'Outlet installation, wiring', isActive: true },
    { name: 'Commercial Electrical', category: 'electrical', description: 'Panel upgrades, commercial wiring', isActive: true },
    { name: 'Roof Repair', category: 'roofing', description: 'Shingle repair, leak fixes', isActive: true },
    { name: 'Roof Installation', category: 'roofing', description: 'New roof installation', isActive: true },
    { name: 'HVAC Maintenance', category: 'hvac', description: 'AC service, furnace maintenance', isActive: true },
    { name: 'HVAC Installation', category: 'hvac', description: 'New system installation', isActive: true },
    { name: 'Basic Carpentry', category: 'carpentry', description: 'Cabinet repair, door installation', isActive: true },
    { name: 'Advanced Carpentry', category: 'carpentry', description: 'Custom woodwork, framing', isActive: true },
    { name: 'Interior Painting', category: 'painting', description: 'Wall painting, touch-ups', isActive: true },
    { name: 'Exterior Painting', category: 'painting', description: 'House exterior, deck staining', isActive: true },
    { name: 'Lawn Care', category: 'landscaping', description: 'Mowing, trimming, basic maintenance', isActive: true },
    { name: 'Landscape Design', category: 'landscaping', description: 'Garden design, hardscaping', isActive: true },
    { name: 'General Handyman', category: 'general_repair', description: 'Basic repairs and maintenance', isActive: true }
  ];

  const createdSkills = [];
  for (const skill of skills) {
    const created = await prisma.skill.create({ data: skill });
    createdSkills.push(created);
  }

  logger.info(`Created ${createdSkills.length} skills`);
  return createdSkills;
};

const seedWorkAreas = async () => {
  const workAreas = [
    {
      name: 'Downtown Austin',
      city: 'Austin',
      county: 'Travis',
      state: 'TX',
      zipCodes: ['78701', '78702', '78703', '78704'],
      centerLat: 30.2672,
      centerLng: -97.7431,
      radiusMiles: 10,
      isActive: true
    },
    {
      name: 'North Austin',
      city: 'Austin',
      county: 'Travis',
      state: 'TX',
      zipCodes: ['78717', '78750', '78759', '78758'],
      centerLat: 30.4518,
      centerLng: -97.7586,
      radiusMiles: 15,
      isActive: true
    },
    {
      name: 'South Austin',
      city: 'Austin',
      county: 'Travis',
      state: 'TX',
      zipCodes: ['78745', '78748', '78749', '78652'],
      centerLat: 30.1333,
      centerLng: -97.7633,
      radiusMiles: 12,
      isActive: true
    },
    {
      name: 'East Austin',
      city: 'Austin',
      county: 'Travis',
      state: 'TX',
      zipCodes: ['78721', '78722', '78723', '78724'],
      centerLat: 30.2849,
      centerLng: -97.6821,
      radiusMiles: 8,
      isActive: true
    },
    {
      name: 'Cedar Park/Leander',
      city: 'Cedar Park',
      county: 'Williamson',
      state: 'TX',
      zipCodes: ['78613', '78641', '78645'],
      centerLat: 30.5052,
      centerLng: -97.8203,
      radiusMiles: 20,
      isActive: true
    }
  ];

  const createdWorkAreas = [];
  for (const workArea of workAreas) {
    const created = await prisma.workArea.create({ data: workArea });
    createdWorkAreas.push(created);
  }

  logger.info(`Created ${createdWorkAreas.length} work areas`);
  return createdWorkAreas;
};

const seedCustomers = async () => {
  const customersData = [
    {
      email: 'john.doe@email.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '(512) 555-0101',
      address: {
        street: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        lat: 30.2672,
        lng: -97.7431
      }
    },
    {
      email: 'jane.smith@email.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '(512) 555-0102',
      address: {
        street: '456 Oak Ave',
        city: 'Austin',
        state: 'TX',
        zipCode: '78750',
        lat: 30.4518,
        lng: -97.7586
      }
    },
    {
      email: 'mike.johnson@email.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      phoneNumber: '(512) 555-0103',
      address: {
        street: '789 Pine St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78745',
        lat: 30.1333,
        lng: -97.7633
      }
    },
    {
      email: 'sarah.wilson@email.com',
      firstName: 'Sarah',
      lastName: 'Wilson',
      phoneNumber: '(512) 555-0104',
      address: {
        street: '321 Cedar Ln',
        city: 'Austin',
        state: 'TX',
        zipCode: '78721',
        lat: 30.2849,
        lng: -97.6821
      }
    },
    {
      email: 'robert.brown@email.com',
      firstName: 'Robert',
      lastName: 'Brown',
      phoneNumber: '(512) 555-0105',
      address: {
        street: '654 Elm Dr',
        city: 'Cedar Park',
        state: 'TX',
        zipCode: '78613',
        lat: 30.5052,
        lng: -97.8203
      }
    }
  ];

  const createdCustomers = [];
  const hashedPassword = await hashPassword('password123');

  for (const customerData of customersData) {
    const { address, ...customerInfo } = customerData;

    // Create address first
    const createdAddress = await prisma.address.create({
      data: address
    });

    // Create customer with address
    const customer = await prisma.customer.create({
      data: {
        ...customerInfo,
        password: hashedPassword,
        addressId: createdAddress.id
      },
      include: {
        address: true
      }
    });

    createdCustomers.push(customer);
  }

  logger.info(`Created ${createdCustomers.length} customers`);
  return createdCustomers;
};

const seedTechnicians = async (skills, workAreas) => {
  const hashedPassword = await hashPassword('tech123');

  const techniciansData = [
    {
      email: 'tech1@fieldservice.com',
      firstName: 'Tom',
      lastName: 'Anderson',
      phoneNumber: '(512) 555-1001',
      employeeId: 'TECH001',
      hourlyRate: 45.00,
      isActive: true,
      skillNames: ['Basic Plumbing', 'Advanced Plumbing'],
      workAreaNames: ['Downtown Austin', 'East Austin']
    },
    {
      email: 'tech2@fieldservice.com',
      firstName: 'Lisa',
      lastName: 'Garcia',
      phoneNumber: '(512) 555-1002',
      employeeId: 'TECH002',
      hourlyRate: 50.00,
      isActive: true,
      skillNames: ['Residential Electrical', 'Commercial Electrical'],
      workAreaNames: ['North Austin', 'Cedar Park/Leander']
    },
    {
      email: 'tech3@fieldservice.com',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      phoneNumber: '(512) 555-1003',
      employeeId: 'TECH003',
      hourlyRate: 55.00,
      isActive: true,
      skillNames: ['Roof Repair', 'Roof Installation', 'Basic Carpentry'],
      workAreaNames: ['South Austin', 'Downtown Austin']
    },
    {
      email: 'tech4@fieldservice.com',
      firstName: 'Amanda',
      lastName: 'Taylor',
      phoneNumber: '(512) 555-1004',
      employeeId: 'TECH004',
      hourlyRate: 48.00,
      isActive: true,
      skillNames: ['HVAC Maintenance', 'HVAC Installation', 'Residential Electrical'],
      workAreaNames: ['North Austin', 'East Austin']
    },
    {
      email: 'tech5@fieldservice.com',
      firstName: 'David',
      lastName: 'Martinez',
      phoneNumber: '(512) 555-1005',
      employeeId: 'TECH005',
      hourlyRate: 42.00,
      isActive: true,
      skillNames: ['Interior Painting', 'Exterior Painting', 'General Handyman'],
      workAreaNames: ['Cedar Park/Leander', 'South Austin']
    }
  ];

  const createdTechnicians = [];

  for (const techData of techniciansData) {
    const { skillNames, workAreaNames, ...techInfo } = techData;

    // Find skill and work area IDs
    const techSkills = skills.filter(s => skillNames.includes(s.name));
    const techWorkAreas = workAreas.filter(wa => workAreaNames.includes(wa.name));

    // Create technician with junction table entries
    const technician = await prisma.technician.create({
      data: {
        ...techInfo,
        password: hashedPassword,
        skills: {
          create: techSkills.map(skill => ({ skillId: skill.id }))
        },
        workAreas: {
          create: techWorkAreas.map(wa => ({ workAreaId: wa.id }))
        }
      },
      include: {
        skills: {
          include: { skill: true }
        },
        workAreas: {
          include: { workArea: true }
        }
      }
    });

    createdTechnicians.push(technician);
  }

  logger.info(`Created ${createdTechnicians.length} technicians`);
  return createdTechnicians;
};

const seedWorkingHours = async (technicians) => {
  const createdWorkingHours = [];

  // Create working hours for each technician (Monday-Friday, 8 AM - 5 PM)
  for (const technician of technicians) {
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const workingHours = await prisma.workingHours.create({
        data: {
          technicianId: technician.id,
          dayOfWeek,
          startTime: '08:00',
          endTime: '17:00',
          isAvailable: true,
          effectiveDate: new Date('2024-01-01')
        }
      });
      createdWorkingHours.push(workingHours);
    }
  }

  logger.info(`Created ${createdWorkingHours.length} working hours records`);
  return createdWorkingHours;
};

const seedAppointments = async (customers, skills, workAreas) => {
  const appointmentsData = [
    {
      customerId: customers[0].id,
      title: 'Kitchen Faucet Repair',
      description: 'Leaking faucet in kitchen needs repair',
      serviceType: 'plumbing',
      skillNames: ['Basic Plumbing'],
      zipCode: '78701',
      address: {
        street: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        lat: 30.2672,
        lng: -97.7431
      },
      scheduledDateTime: new Date('2024-12-15T10:00:00Z'),
      estimatedDuration: 120,
      priority: 'medium',
      status: 'pending'
    },
    {
      customerId: customers[1].id,
      title: 'Outlet Installation',
      description: 'Need additional outlets in home office',
      serviceType: 'electrical',
      skillNames: ['Residential Electrical'],
      zipCode: '78750',
      address: {
        street: '456 Oak Ave',
        city: 'Austin',
        state: 'TX',
        zipCode: '78750',
        lat: 30.4518,
        lng: -97.7586
      },
      scheduledDateTime: new Date('2024-12-16T14:00:00Z'),
      estimatedDuration: 90,
      priority: 'high',
      status: 'pending'
    },
    {
      customerId: customers[2].id,
      title: 'Roof Leak Repair',
      description: 'Leak in roof after recent rain',
      serviceType: 'roofing',
      skillNames: ['Roof Repair'],
      zipCode: '78745',
      address: {
        street: '789 Pine St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78745',
        lat: 30.1333,
        lng: -97.7633
      },
      scheduledDateTime: new Date('2024-12-17T09:00:00Z'),
      estimatedDuration: 180,
      priority: 'urgent',
      status: 'pending'
    },
    {
      customerId: customers[3].id,
      title: 'AC Maintenance',
      description: 'Annual AC maintenance service',
      serviceType: 'hvac',
      skillNames: ['HVAC Maintenance'],
      zipCode: '78721',
      address: {
        street: '321 Cedar Ln',
        city: 'Austin',
        state: 'TX',
        zipCode: '78721',
        lat: 30.2849,
        lng: -97.6821
      },
      scheduledDateTime: new Date('2024-12-18T11:00:00Z'),
      estimatedDuration: 90,
      priority: 'low',
      status: 'pending'
    },
    {
      customerId: customers[4].id,
      title: 'Interior Painting',
      description: 'Paint living room and bedroom',
      serviceType: 'painting',
      skillNames: ['Interior Painting'],
      zipCode: '78613',
      address: {
        street: '654 Elm Dr',
        city: 'Cedar Park',
        state: 'TX',
        zipCode: '78613',
        lat: 30.5052,
        lng: -97.8203
      },
      scheduledDateTime: new Date('2024-12-19T08:00:00Z'),
      estimatedDuration: 480,
      priority: 'medium',
      status: 'pending'
    },
    {
      customerId: customers[0].id,
      title: 'Water Heater Installation',
      description: 'Install new water heater - COMPLETED SAMPLE',
      serviceType: 'plumbing',
      skillNames: ['Advanced Plumbing'],
      zipCode: '78701',
      address: {
        street: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        lat: 30.2672,
        lng: -97.7431
      },
      scheduledDateTime: new Date('2024-11-20T09:00:00Z'),
      estimatedDuration: 240,
      priority: 'high',
      status: 'completed',
      completedAt: new Date('2024-11-20T13:00:00Z'),
      customerFeedback: {
        rating: 5,
        comment: 'Excellent service! Very professional and on time.',
        submittedAt: new Date('2024-11-20T14:00:00Z').toISOString()
      }
    }
  ];

  const createdAppointments = [];

  for (const apptData of appointmentsData) {
    const { skillNames, zipCode, address, ...apptInfo } = apptData;

    // Find work area for this zip code
    const workArea = workAreas.find(wa => wa.zipCodes.includes(zipCode));
    if (!workArea) {
      logger.warn(`No work area found for zip code ${zipCode}`);
      continue;
    }

    // Find required skills
    const requiredSkills = skills.filter(s => skillNames.includes(s.name));

    // Create address
    const createdAddress = await prisma.address.create({
      data: address
    });

    // Create appointment with junction table entries
    const appointment = await prisma.serviceAppointment.create({
      data: {
        ...apptInfo,
        workAreaId: workArea.id,
        addressId: createdAddress.id,
        requiredSkills: {
          create: requiredSkills.map(skill => ({ skillId: skill.id }))
        }
      },
      include: {
        customer: {
          include: { address: true }
        },
        requiredSkills: {
          include: { skill: true }
        },
        workArea: true,
        address: true
      }
    });

    createdAppointments.push(appointment);
  }

  logger.info(`Created ${createdAppointments.length} appointments`);
  return createdAppointments;
};

const seed = async () => {
  try {
    logger.info('Starting database seed...');

    await clearDatabase();

    const skills = await seedSkills();
    const workAreas = await seedWorkAreas();
    const customers = await seedCustomers();
    const technicians = await seedTechnicians(skills, workAreas);
    await seedWorkingHours(technicians);
    await seedAppointments(customers, skills, workAreas);

    logger.info('✓ Database seeding completed successfully!');
    logger.info('');
    logger.info('Test Credentials:');
    logger.info('Customer: john.doe@email.com / password123');
    logger.info('Technician: tech1@fieldservice.com / tech123');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed };
