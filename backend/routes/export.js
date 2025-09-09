
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const auth = require('../middleware/auth');

// @route   GET /api/export/waste-records
// @desc    Export all waste records to Excel
// @access  Private
router.get('/waste-records', auth, exportController.exportWasteRecords);

module.exports = router;
