#!/usr/bin/env node

/**
 * Debug script for election status cron endpoint
 * This script helps diagnose issues with the cron endpoint
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Get environment variables
const CRON_SECRET = process.env.CRON_SECRET;
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('🔍 Debugging Election Status Cron Endpoint');
console.log('=========================================');
console.log('Deployment URL:', DEPLOYMENT_URL);
console.log('Cron Secret Set:', !!CRON_SECRET);
console.log('');

// Validate environment
if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET is not set in environment variables');
  console.error('💡 Please set CRON_SECRET in your .env.local file');
  process.exit(1);
}

if (!DEPLOYMENT_URL) {
  console.error('❌ DEPLOYMENT_URL is not set in environment variables');
  console.error('💡 Please set DEPLOYMENT_URL in your .env.local file');
  process.exit(1);
}

// Construct the endpoint URL
const baseUrl = DEPLOYMENT_URL.replace(/\/$/, ''); // Remove trailing slash
const endpoint = `${baseUrl}/api/cron/election-status`;

console.log('📡 Testing endpoint:', endpoint);
console.log('');

// Make the request
const url = new URL(endpoint);
const options = {
  hostname: url.hostname,
  port: url.port,
  path: url.pathname,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json',
    'User-Agent': 'debug-script/1.0'
  }
};

console.log('🔧 Request Options:');
console.log('  Host:', options.hostname);
console.log('  Port:', options.port || (url.protocol === 'https:' ? 443 : 80));
console.log('  Path:', options.path);
console.log('  Method:', options.method);
console.log('  Headers:', Object.keys(options.headers));
console.log('');

// Determine which protocol to use
const client = url.protocol === 'https:' ? https : http;

const req = client.request(options, (res) => {
  let data = '';
  
  console.log('📥 Response Received:');
  console.log('  Status Code:', res.statusCode);
  console.log('  Headers:', Object.keys(res.headers));
  console.log('');
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response Body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(data);
    }
    
    console.log('');
    if (res.statusCode === 200) {
      console.log('✅ Request successful!');
    } else {
      console.log('❌ Request failed with status:', res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.error('💥 Request Error:');
  console.error(error);
  console.log('');
  console.log('💡 Troubleshooting Tips:');
  console.log('  1. Check if your application is running');
  console.log('  2. Verify the DEPLOYMENT_URL is correct');
  console.log('  3. Ensure the CRON_SECRET matches the server configuration');
  console.log('  4. Check firewall/network connectivity');
});

req.on('timeout', () => {
  console.error('⏰ Request timed out');
  req.destroy();
});

req.setTimeout(10000); // 10 second timeout

console.log('🚀 Sending request...');
req.end();