// Debug script to check route structure
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Function to recursively list all route.ts files
function listRouteFiles(dir, prefix = '') {
  try {
    const items = readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        listRouteFiles(fullPath, `${prefix}/${item}`);
      } else if (item === 'route.ts') {
        console.log(`${prefix}/${item}`);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

console.log('Route files in app/api:');
listRouteFiles('./app/api');