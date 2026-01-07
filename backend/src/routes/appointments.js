const express = require('express');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  createAppointment,
  getCustomerAppointments,
  getAppointmentById,
  submitFeedback
} = require('../controllers/appointmentController');

const router = express.Router();

const createAppointmentValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('serviceType')
    .isIn(['plumbing', 'electrical', 'roofing', 'hvac', 'general_repair', 'carpentry', 'painting', 'landscaping'])
    .withMessage('Invalid service type'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code'),
  body('scheduledDateTime')
    .isISO8601()
    .toDate()
    .custom(value => {
      if (value <= new Date()) {
        throw new Error('Appointment must be scheduled for a future date');
      }
      return true;
    }),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 30, max: 480 })
    .withMessage('Duration must be between 30 and 480 minutes'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('requiredSkills')
    .isArray({ min: 1 })
    .withMessage('At least one skill must be selected'),
  body('requiredSkills.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Invalid skill ID')
];

const feedbackValidation = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Invalid appointment ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters')
];

router.post('/', authenticateToken, requireRole('customer'), createAppointmentValidation, handleValidationErrors, createAppointment);
router.get('/', authenticateToken, requireRole('customer'), getCustomerAppointments);
router.get('/:id', authenticateToken, param('id').isString().trim().notEmpty(), handleValidationErrors, getAppointmentById);
router.post('/:id/feedback', authenticateToken, requireRole('customer'), feedbackValidation, handleValidationErrors, submitFeedback);

module.exports = router;