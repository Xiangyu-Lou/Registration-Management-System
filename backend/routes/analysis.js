
const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const auth = require('../middleware/auth'); // Secure the endpoints

// All routes in this file are prefixed with /api/analysis

// @route   GET /api/analysis/trends
// @desc    Get waste generation trends over time
// @access  Private
router.get('/trends', auth, analysisController.getWasteTrends);

// @route   GET /api/analysis/composition
// @desc    Get waste composition by type (pie chart)
// @access  Private
router.get('/composition', auth, analysisController.getWasteComposition);

// @route   GET /api/analysis/unit-performance
// @desc    Get waste generation by unit (bar chart)
// @access  Private
router.get('/unit-performance', auth, analysisController.getUnitPerformance);


module.exports = router;
