
const ExcelJS = require('exceljs');
const WasteRecord = require('../models/WasteRecord'); // Adjust the path if needed

exports.exportWasteRecords = async (req, res) => {
  try {
    const records = await WasteRecord.query().withGraphFetched('[wasteType, unit, user]'); // Fetch all records with relations

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Waste Records');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Waste Type', key: 'wasteType', width: 30 },
      { header: 'Weight', key: 'weight', width: 15 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'User', key: 'user', width: 30 },
      { header: 'Date', key: 'date', width: 20 }
    ];

    // Add rows
    records.forEach(record => {
      worksheet.addRow({
        id: record.id,
        wasteType: record.wasteType ? record.wasteType.name : 'N/A',
        weight: record.weight,
        unit: record.unit ? record.unit.name : 'N/A',
        user: record.user ? record.user.username : 'N/A',
        date: new Date(record.created_at).toLocaleDateString()
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'waste_records.xlsx'
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).send('Error exporting data');
  }
};
