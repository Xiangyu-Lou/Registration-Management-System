const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const app = require('../backend/app');

module.exports = app;
