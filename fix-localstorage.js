const fs = require('fs');

const files = [
  'src/contexts/BudgetContext.tsx',
  'src/contexts/ThemeContext.tsx',
  'src/contexts/TransactionContext.tsx',
  'src/utils/blockchain.ts'
];

files.forEach(f => {
  let data = fs.readFileSync(f, 'utf8');
  
  // Replace localStorage.getItem with window check
  data = data.replace(/localStorage\.getItem\(([^)]+)\)/g, "(typeof window !== 'undefined' ? localStorage.getItem($1) : null)");
  
  // Replace localStorage.setItem with window check
  data = data.replace(/localStorage\.setItem\(([^)]+)\)/g, "if (typeof window !== 'undefined') localStorage.setItem($1)");
  
  fs.writeFileSync(f, data);
});

console.log("localStorage SSR errors fixed!");
