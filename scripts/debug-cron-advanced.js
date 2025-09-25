#!/usr/bin/env node

/**
 * Advanced Debug script for election status cron endpoint
 * This script provides detailed diagnostics for cron endpoint issues
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Get environment variables
const CRON_SECRET = process.env.CRON_SECRET;
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('🔍 Advanced Debugging for Election Status Cron Endpoint');
console.log('=====================================================');
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

// Parse URL for detailed analysis
let url;
try {
  url = new URL(endpoint);
} catch (e) {
  console.error('❌ Invalid URL format:', endpoint);
  process.exit(1);
}

console.log('🔧 URL Analysis:');
console.log('  Protocol:', url.protocol);
console.log('  Hostname:', url.hostname);
console.log('  Port:', url.port || (url.protocol === 'https:' ? 443 : 80));
console.log('  Path:', url.pathname);
console.log('');

// Test DNS resolution
const dns = require('dns');

console.log('🔍 Testing DNS resolution...');
dns.lookup(url.hostname, (err, address, family) => {
  if (err) {
    console.error('❌ DNS resolution failed:', err.message);
    console.log('💡 Troubleshooting Tips:');
    console.log('  1. Check if the domain name is correct');
    console.log('  2. Verify your internet connection');
    console.log('  3. Check if there are firewall restrictions');
    return;
  }
  
  console.log('✅ DNS resolution successful');
  console.log('  IP Address:', address);
  console.log('  IP Family:', family);
  console.log('');
  
  // Test port connectivity
  console.log('🔍 Testing port connectivity...');
  const port = url.port || (url.protocol === 'https:' ? 443 : 80);
  
  const socket = new require('net').Socket();
  socket.setTimeout(10000); // 10 second timeout
  
  socket.on('connect', () => {
    console.log('✅ Port connectivity successful');
    socket.destroy();
    
    // Make the actual HTTP request
    makeHttpRequest();
  });
  
  socket.on('timeout', () => {
    console.error('❌ Port connection timed out');
    socket.destroy();
    console.log('💡 Troubleshooting Tips:');
    console.log('  1. Check if the server is running');
    console.log('  2. Verify firewall settings');
    console.log('  3. Check if the port is correct');
  });
  
  socket.on('error', (err) => {
    console.error('❌ Port connection failed:', err.message);
    console.log('💡 Troubleshooting Tips:');
    console.log('  1. Check if the server is running');
    console.log('  2. Verify firewall settings');
    console.log('  3. Check if the port is correct');
  });
  
  socket.connect(port, url.hostname);
});

function makeHttpRequest() {
  console.log('🔍 Making HTTP request...');
  
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
  console.log('');

  // Determine which protocol to use
  const client = url.protocol === 'https:' ? https : http;

  const req = client.request(options, (res) => {
    let data = '';
    
    console.log('📥 Response Received:');
    console.log('  Status Code:', res.statusCode);
    console.log('  Headers:', res.headers);
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
}