#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Checking for hardcoded localhost URLs in the codebase...');

// Use grep to find all instances of localhost
try {
  // Search in all files in client/src directory
  const clientResults = execSync(
    'grep -r "localhost:5000" --include="*.js" --include="*.jsx" --include="*.css" --include="*.html" ./client/src'
  ).toString();
  
  if (clientResults.trim()) {
    console.log('\n❌ Localhost URLs found in client code:');
    console.log(clientResults);
    console.log('\nPlease replace these with environment variables! Example:');
    console.log('Replace: http://localhost:5000/api');
    console.log('With: ${import.meta.env.VITE_API_URL}');
  } else {
    console.log('✅ No localhost URLs found in client/src');
  }
} catch (error) {
  // If grep doesn't find any matches, it returns a non-zero exit code
  if (error.status === 1) {
    console.log('✅ No localhost URLs found in client/src');
  } else {
    console.error('Error searching client files:', error.message);
  }
}

// Check server code
try {
  const serverResults = execSync(
    'grep -r "localhost:5000" --include="*.js" ./server'
  ).toString();
  
  if (serverResults.trim()) {
    console.log('\n❌ Localhost URLs found in server code:');
    console.log(serverResults);
    console.log('\nPlease replace these with environment variables!');
  } else {
    console.log('✅ No localhost URLs found in server');
  }
} catch (error) {
  if (error.status === 1) {
    console.log('✅ No localhost URLs found in server');
  } else {
    console.error('Error searching server files:', error.message);
  }
}

console.log('\nDone checking for localhost URLs.');
console.log('For a production deployment, ensure all URLs use environment variables!');