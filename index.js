require('dotenv').config();

const { setupDatabase } = require('./src/backend/database/setupdb');
const { startServer } = require('./src/backend/server/app');
const { exportServicesCatalog } = require('./src/backend/database/serviceExporter');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await setupDatabase(); 
    console.log('Database connection pool is ready.');
    try {
      const exportResult = await exportServicesCatalog();
      console.log(`Services catalog exported to ${exportResult.path} (${exportResult.servicesCount} services, extraTxt=${exportResult.includedFiles.length}).`);
    } catch (exportError) {
      console.warn('Failed to export services catalog:', exportError.message || exportError);
    }

    await startServer({ port: PORT });
    console.log(`API server listening on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
