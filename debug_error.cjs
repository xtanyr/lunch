const fs = require('fs');
const sourceMap = require('source-map');

async function debugError() {
  try {
    const map = JSON.parse(fs.readFileSync('dist/assets/index-DQ8LZ-Ut.js.map', 'utf8'));
    const consumer = new sourceMap.SourceMapConsumer(map);
    const position = { line: 89, column: 7231 };
    const original = consumer.originalPositionFor(position);
    console.log('Original position:', original);
    
    // Also try to find the actual error context
    if (original.source) {
      console.log('\nSource file:', original.source);
      console.log('Line:', original.line);
      console.log('Column:', original.column);
      console.log('Name:', original.name);
    }
    
    consumer.destroy();
  } catch (error) {
    console.error('Error debugging:', error);
  }
}

debugError();
