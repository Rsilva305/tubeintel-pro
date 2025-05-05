const fs = require('fs');
const { exec } = require('child_process');

console.log('🚀 Setting up TubeIntel Pro...');

// Function to run shell commands
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function setup() {
  try {
    // Install dependencies
    console.log('📦 Installing dependencies...');
    await runCommand('npm install');

    // Create necessary directories if they don't exist
    const directories = [
      'src/app',
      'src/components',
      'src/lib',
      'src/hooks',
      'src/contexts',
      'src/types',
      'src/utils',
      'src/styles',
      'src/services/api'
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log('✅ Setup completed!');
    console.log('');
    console.log('To start the development server, run:');
    console.log('npm run dev');
    console.log('');
    console.log('Then open http://localhost:3000 in your browser.');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setup(); 