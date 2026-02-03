require('dotenv').config();
const fs = require('fs');

// Try using psql if available
const { execSync } = require('child_process');

const sql = fs.readFileSync('./migrations/005_create_flows_table.sql', 'utf8');

console.log('Please run this SQL in your Supabase SQL Editor:\n');
console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log('\nSteps:');
console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
console.log('2. Paste the SQL above');
console.log('3. Click "Run"');
console.log('\nOr paste this into the SQL editor and run it.');
