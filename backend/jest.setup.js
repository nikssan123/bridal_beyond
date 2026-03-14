// Load test env so integration tests (and any code that reads env on load) see test config.
// Create backend/.env.test with DATABASE_URL, JWT_SECRET, etc. for integration tests.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });
