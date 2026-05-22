const fs = require('fs');
const files = [
  'src/components/SMSSyncStatus.tsx',
  'src/components/dashboard/AIInsights.tsx',
  'src/components/dashboard/ChatInterface.tsx'
];

files.forEach(f => {
  let data = fs.readFileSync(f, 'utf8');
  if (!data.includes('"use client"')) {
    fs.writeFileSync(f, '"use client";\n' + data);
    console.log('Added use client to', f);
  } else {
    console.log('Already has use client', f);
  }
});
