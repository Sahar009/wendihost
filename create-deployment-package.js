const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files and folders to include in deployment
const includeFiles = [
  'src',
  'public',
  'prisma',
  'package.json',
  'yarn.lock',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  '.next',
];

// Files to exclude
const excludePatterns = [
  'node_modules',
  '.git',
  '.env.local',
  '.DS_Store',
  '*.log',
  'uploads',
  '.next/cache',
];

console.log('Creating deployment package...');

// Create a deployment folder
const deploymentFolder = 'deployment-package';
if (fs.existsSync(deploymentFolder)) {
  fs.rmSync(deploymentFolder, { recursive: true, force: true });
}
fs.mkdirSync(deploymentFolder);

// Copy files
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Warning: ${src} does not exist`);
    return;
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      // Check if file should be excluded
      const shouldExclude = excludePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(file);
        }
        return file === pattern || srcPath.includes(pattern);
      });
      
      if (!shouldExclude) {
        copyRecursive(srcPath, destPath);
      }
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy essential files
includeFiles.forEach(file => {
  const srcPath = path.join(process.cwd(), file);
  const destPath = path.join(process.cwd(), deploymentFolder, file);
  console.log(`Copying ${file}...`);
  copyRecursive(srcPath, destPath);
});

console.log('\nDeployment package created in:', deploymentFolder);
console.log('\nNext steps:');
console.log('1. Zip the deployment-package folder');
console.log('2. Upload to your server');
console.log('3. On server, extract and run:');
console.log('   - yarn install');
console.log('   - npx prisma generate');
console.log('   - yarn start');
console.log('\nNote: You will need to manually add your .env files on the server!');

