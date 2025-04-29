const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run a command and log output
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    process.exit(1);
  }
}

// Main build function
async function build() {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Starting build process in ${isProduction ? 'production' : 'development'} mode`);

  // Install dependencies
  runCommand('npm install');
  runCommand('cd client && npm install');
  runCommand('cd server && npm install');

  // Build client
  console.log('Building client...');
  runCommand('cd client && npm run build');

  // Create public directory if it doesn't exist
  const publicDir = path.join(__dirname, '../server/public');
  if (!fs.existsSync(publicDir)) {
    console.log('Creating public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy built files to server public directory
  console.log('Copying built files to server public directory...');
  const distDir = path.join(__dirname, '../client/dist');
  if (!fs.existsSync(distDir)) {
    console.error('Client dist directory not found. Build might have failed.');
    process.exit(1);
  }

  // Use cp command for both environments
  const copyCommand = `cp -r ${distDir}/* ${publicDir}/`;
  runCommand(copyCommand);

  console.log('Build completed successfully!');
}

// Run the build
build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
}); 