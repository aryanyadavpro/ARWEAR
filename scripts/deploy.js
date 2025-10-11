#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ARWEAR Production Deployment Script');
console.log('=====================================\n');

const PROJECT_ROOT = path.join(__dirname, '..');

// Utility functions
function runCommand(command, description) {
  console.log(`⏳ ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: PROJECT_ROOT,
      timeout: 300000 // 5 minutes timeout
    });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ ${description} not found: ${filePath}`);
    process.exit(1);
  }
  console.log(`✅ ${description} exists`);
}

function validateEnvironment() {
  console.log('🔍 Validating environment...');
  
  // Check critical files
  const criticalFiles = [
    { path: 'package.json', desc: 'Package configuration' },
    { path: 'next.config.js', desc: 'Next.js configuration' },
    { path: 'tailwind.config.js', desc: 'Tailwind configuration' },
    { path: 'tsconfig.json', desc: 'TypeScript configuration' },
    { path: '.env.example', desc: 'Environment example' }
  ];

  criticalFiles.forEach(file => {
    checkFileExists(file.path, file.desc);
  });

  // Check for essential directories
  const criticalDirs = [
    'app',
    'components', 
    'lib',
    'public'
  ];

  criticalDirs.forEach(dir => {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
      console.error(`❌ Critical directory missing: ${dir}`);
      process.exit(1);
    }
    console.log(`✅ Directory exists: ${dir}`);
  });

  console.log('✅ Environment validation passed\n');
}

function runTests() {
  console.log('🧪 Running tests...');
  
  try {
    // Check if there are any test files
    const hasTests = fs.existsSync(path.join(PROJECT_ROOT, '__tests__')) || 
                    fs.existsSync(path.join(PROJECT_ROOT, 'tests')) ||
                    fs.readdirSync(PROJECT_ROOT).some(file => file.includes('.test.'));
    
    if (hasTests) {
      runCommand('npm test', 'Running test suite');
    } else {
      console.log('⚠️  No tests found, skipping test phase');
    }
  } catch (error) {
    console.log('⚠️  Test phase skipped (tests may not be configured)');
  }
}

function buildApplication() {
  console.log('🏗️  Building application...');
  
  // Clean previous build
  if (fs.existsSync(path.join(PROJECT_ROOT, '.next'))) {
    runCommand('rm -rf .next', 'Cleaning previous build');
  }
  
  // Build the application
  runCommand('npm run build', 'Building Next.js application');
  
  // Verify build output
  const buildDir = path.join(PROJECT_ROOT, '.next');
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build failed - no .next directory found');
    process.exit(1);
  }
  
  console.log('✅ Build completed successfully\n');
}

function validateBuild() {
  console.log('🔍 Validating build output...');
  
  const buildDir = path.join(PROJECT_ROOT, '.next');
  
  // Check for critical build files
  const criticalBuildFiles = [
    'static',
    'server',
    'BUILD_ID'
  ];
  
  criticalBuildFiles.forEach(item => {
    const itemPath = path.join(buildDir, item);
    if (!fs.existsSync(itemPath)) {
      console.error(`❌ Missing build artifact: ${item}`);
      process.exit(1);
    }
    console.log(`✅ Build artifact exists: ${item}`);
  });
  
  console.log('✅ Build validation passed\n');
}

function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  runCommand('npm audit --audit-level=high', 'Checking for security vulnerabilities');
  
  console.log('✅ Dependency check completed\n');
}

function optimizeAssets() {
  console.log('⚡ Optimizing assets...');
  
  // Check if optimization tools are available
  try {
    // This is a placeholder - you can add actual asset optimization here
    console.log('🎨 Image optimization: Handled by Next.js');
    console.log('📝 CSS optimization: Handled by Tailwind/Next.js');
    console.log('🗜️  JavaScript minification: Handled by Next.js');
    
    console.log('✅ Asset optimization completed\n');
  } catch (error) {
    console.log('⚠️  Asset optimization skipped');
  }
}

function generateDeploymentInfo() {
  console.log('📋 Generating deployment info...');
  
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    version: require(path.join(PROJECT_ROOT, 'package.json')).version,
    buildId: fs.readFileSync(path.join(PROJECT_ROOT, '.next', 'BUILD_ID'), 'utf8').trim(),
    environment: process.env.NODE_ENV || 'production',
    features: [
      'AR/VR Product Viewing',
      'Authentication System',
      'Database Integration',
      'E-commerce Functionality',
      'Responsive Design',
      'SEO Optimization'
    ],
    requirements: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  fs.writeFileSync(
    path.join(PROJECT_ROOT, 'deployment-info.json'), 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('✅ Deployment info generated\n');
  return deploymentInfo;
}

function showDeploymentSummary(deploymentInfo) {
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('====================');
  console.log(`🏷️  Version: ${deploymentInfo.version}`);
  console.log(`🆔 Build ID: ${deploymentInfo.buildId}`);
  console.log(`⏰ Timestamp: ${deploymentInfo.timestamp}`);
  console.log(`🌍 Environment: ${deploymentInfo.environment}`);
  console.log(`🔧 Node.js: ${deploymentInfo.requirements.node}`);
  console.log(`💻 Platform: ${deploymentInfo.requirements.platform}`);
  
  console.log('\n🎯 FEATURES DEPLOYED:');
  deploymentInfo.features.forEach(feature => {
    console.log(`   ✅ ${feature}`);
  });
  
  console.log('\n📋 NEXT STEPS:');
  console.log('   1. Upload build artifacts to your hosting platform');
  console.log('   2. Configure environment variables');
  console.log('   3. Run database migrations if needed');
  console.log('   4. Start the production server');
  console.log('   5. Run health checks');
  
  console.log('\n🚀 DEPLOYMENT READY!');
  console.log('=====================\n');
}

// Main deployment process
async function deploy() {
  console.log('Starting deployment process...\n');
  
  try {
    // Step 1: Environment validation
    validateEnvironment();
    
    // Step 2: Dependency check
    checkDependencies();
    
    // Step 3: Run tests
    runTests();
    
    // Step 4: Build application
    buildApplication();
    
    // Step 5: Validate build
    validateBuild();
    
    // Step 6: Optimize assets
    optimizeAssets();
    
    // Step 7: Generate deployment info
    const deploymentInfo = generateDeploymentInfo();
    
    // Step 8: Show summary
    showDeploymentSummary(deploymentInfo);
    
    console.log('🎉 DEPLOYMENT PREPARATION COMPLETED SUCCESSFULLY! 🎉');
    
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED');
    console.error('===================');
    console.error(error.message);
    process.exit(1);
  }
}

// Run deployment if script is executed directly
if (require.main === module) {
  deploy();
}

module.exports = { deploy };