#!/usr/bin/env node

/**
 * Script để tạo file knowledge base (services.md) cho chatbot
 * Chạy lệnh: node generate-chatbot-knowledge.js
 */

// Load environment variables
require('dotenv').config();

const { exportServicesCatalog, DEFAULT_EXPORT_PATH } = require('./src/backend/database/serviceExporter');

async function main() {
  console.log('🤖 Đang tạo knowledge base cho chatbot...');
  console.log('');

  try {
    const result = await exportServicesCatalog();

    console.log('✅ Tạo thành công!');
    console.log('');
    console.log('📄 File:', result.path);
    console.log('📊 Số dịch vụ:', result.servicesCount);

    if (result.includedFiles && result.includedFiles.length > 0) {
      console.log('📚 Files tham khảo:');
      result.includedFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
    }

    console.log('');
    console.log('💡 File này sẽ được dùng làm context cho BotChat Support');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo knowledge base:', error.message || error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
