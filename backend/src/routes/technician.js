const express = require('express');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAvailableJobs,
  acceptJob,
  getMyJobs,
  updateJobStatus
} = require('../controllers/technicianController');

const router = express.Router();

const acceptJobValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid appointment ID')
];

const updateStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  body('status')
    .isIn(['in_progress', 'completed'])
    .withMessage('Invalid status'),
  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Completion notes must not exceed 1000 characters')
];

router.get('/jobs/available', authenticateToken, requireRole('technician'), getAvailableJobs);
router.get('/jobs/my', authenticateToken, requireRole('technician'), getMyJobs);
router.post('/jobs/:id/accept', authenticateToken, requireRole('technician'), acceptJobValidation, handleValidationErrors, acceptJob);
router.patch('/jobs/:id/status', authenticateToken, requireRole('technician'), updateStatusValidation, handleValidationErrors, updateJobStatus);

module.exports = router;