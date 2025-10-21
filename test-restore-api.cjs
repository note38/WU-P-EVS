const fs = require('fs');

// Read the test backup file
const backupData = JSON.parse(fs.readFileSync('./test-backup.json', 'utf8'));

console.log('Testing restore API with data:');
console.log('Metadata:', backupData.metadata);
console.log('Users count:', backupData.users.length);
console.log('Elections count:', backupData.elections.length);

// Since we can't use fetch in Node.js without importing it, let's just log the data
console.log('Would send this data to /api/restore:');
console.log(JSON.stringify(backupData, null, 2));

// Test the restore API
fetch('http://localhost:3000/api/restore', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(backupData),
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});