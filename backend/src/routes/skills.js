const express = require('express');
const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// @desc    Get all skills
// @route   GET /api/v1/skills
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;

  const where = category ? { category } : {};
  const skills = await prisma.skill.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: skills
  });
}));

// @desc    Get skill by ID
// @route   GET /api/v1/skills/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const skill = await prisma.skill.findUnique({
    where: { id: req.params.id }
  });

  if (!skill) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SKILL_NOT_FOUND',
        message: 'Skill not found'
      }
    });
  }

  res.json({
    success: true,
    data: skill
  });
}));

module.exports = router;