const fs = require('fs');
const sourceMap = require('source-map');

async function debugError() {
  try {
    const map = JSON.parse(fs.readFileSync('dist/assets/index-Bph30QRI.js.map', 'utf8'));
    const result = await sourceMap.SourceMapConsumer.with(map, null, consumer => {
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

      return original;
    });
  } catch (error) {
    console.error('Error debugging:', error);
  }
}

debugError();
