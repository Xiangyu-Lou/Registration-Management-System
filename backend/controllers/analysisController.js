
const { db } = require('../config/database');
const WasteRecord = require('../models/WasteRecord');
const { raw } = require('objection');

// Helper to get the date format string based on the database driver
const getDateFormat = (period) => {
  const driver = db.client.config.client;
  // Note: This relies on the date/time functions of the specific SQL database.
  // This is a simplified example. For production, you might want to use a library
  // or more robust date handling.
  if (driver === 'mysql' || driver === 'mysql2') {
    switch (period) {
      case 'yearly':
        return '%Y';
      case 'monthly':
        return '%Y-%m';
      default: // daily
        return '%Y-%m-%d';
    }
  }
  if (driver === 'pg') {
    // For PostgreSQL
    switch (period) {
      case 'yearly':
        return 'YYYY';
      case 'monthly':
        return 'YYYY-MM';
      default: // daily
        return 'YYYY-MM-DD';
    }
  }
  // Fallback for SQLite
  switch (period) {
      case 'yearly':
        return '%Y';
      case 'monthly':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
};

/**
 * @description Get waste trends over a specified period.
 * @route GET /api/analysis/trends
 */
exports.getWasteTrends = async (req, res) => {
  try {
    const { startDate, endDate, wasteTypeId, unitId, period = 'daily' } = req.query;

    const dateFormatStr = getDateFormat(period);
    
    // Using Objection.js's raw function for database-specific date formatting
    const query = WasteRecord.query()
      .select(
        raw(`strftime('${dateFormatStr}', collection_start_time) as date`),
        raw('SUM(quantity) as totalQuantity')
      )
      .whereNotNull('collection_start_time')
      .groupBy('date')
      .orderBy('date', 'asc');

    if (startDate && endDate) {
      // Ensure dates are in a format the database understands (ISO 8601)
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();
      query.whereBetween('collection_start_time', [start, end]);
    }
    if (wasteTypeId) {
      query.where('waste_type_id', wasteTypeId);
    }
    if (unitId) {
      query.where('unit_id', unitId);
    }

    const data = await query;
    res.json(data);

  } catch (error) {
    console.error('Error fetching waste trends:', error);
    res.status(500).json({ message: 'Error fetching waste trends' });
  }
};

/**
 * @description Get waste composition by type.
 * @route GET /api/analysis/composition
 */
exports.getWasteComposition = async (req, res) => {
  try {
    const { startDate, endDate, unitId } = req.query;

    const query = WasteRecord.query()
      .select('waste_type.name')
      .sum('quantity as totalQuantity')
      .join('waste_type', 'waste_record.waste_type_id', 'waste_type.id')
      .groupBy('waste_type.name')
      .orderBy('totalQuantity', 'desc');

    if (startDate && endDate) {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();
      query.whereBetween('collection_start_time', [start, end]);
    }
    if (unitId) {
      query.where('unit_id', unitId);
    }

    const data = await query;
    // Format for ECharts: { value, name }
    const chartData = data.map(item => ({
        value: parseFloat(item.totalQuantity) || 0,
        name: item.name
    }));
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching waste composition:', error);
    res.status(500).json({ message: 'Error fetching waste composition' });
  }
};

/**
 * @description Get waste generation performance by unit.
 * @route GET /api/analysis/unit-performance
 */
exports.getUnitPerformance = async (req, res) => {
  try {
    const { startDate, endDate, wasteTypeId } = req.query;

    const query = WasteRecord.query()
      .select('unit.name')
      .sum('quantity as totalQuantity')
      .join('unit', 'waste_record.unit_id', 'unit.id')
      .groupBy('unit.name')
      .orderBy('totalQuantity', 'desc');

    if (startDate && endDate) {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();
      query.whereBetween('collection_start_time', [start, end]);
    }
    if (wasteTypeId) {
      query.where('waste_type_id', wasteTypeId);
    }

    const data = await query;
     // Format for ECharts bar chart: { names: [], values: [] }
    const chartData = {
        names: data.map(item => item.name),
        values: data.map(item => parseFloat(item.totalQuantity) || 0)
    };
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching unit performance:', error);
    res.status(500).json({ message: 'Error fetching unit performance' });
  }
};
