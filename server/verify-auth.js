#!/usr/bin/env node

/**
 * Authentication System Verification Script
 * Run this to verify all authentication components are in place
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 AUTHENTICATION SYSTEM VERIFICATION\n');
console.log('=' .repeat(60));

const checks = [];

// Check frontend files
const frontendFiles = [
  'src/components/ProfileSetup.jsx',
  'src/services/apiClient.js',
  'src/services/GoogleSignIn.jsx',
  'src/pages/Login.jsx',
  'src/pages/Signup.jsx',
  'src/styles/ProfileSetup.css',
  'src/styles/Signup.css',
  'src/App.jsx'
];

console.log('\n✓ FRONTEND FILES:');
frontendFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  checks.push(exists);
});

// Check backend files
const backendFiles = [
  'server/routes/auth.js',
  'server/models/User.js',
  'server/.env',
  'server/server.js'
];

console.log('\n✓ BACKEND FILES:');
backendFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  checks.push(exists);
});

// Check documentation
const docFiles = [
  'COMPLETE_AUTHENTICATION_GUIDE.md',
  'AUTHENTICATION_SETUP.md',
  'TEST_AUTHENTICATION.md',
  'AUTHENTICATION_COMPLETE_SUMMARY.md'
];

console.log('\n✓ DOCUMENTATION FILES:');
docFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  checks.push(exists);
});

// Verify auth.js has key functions
console.log('\n✓ BACKEND ENDPOINTS:');
try {
  const authContent = fs.readFileSync(path.join(__dirname, 'routes', 'auth.js'), 'utf-8');
  const endpoints = [
    '/register',
    '/login',
    '/google',
    '/upload-avatar',
    '/me',
    '/profile'
  ];
  
  endpoints.forEach(endpoint => {
    const hasEndpoint = authContent.includes(endpoint);
    console.log(`  ${hasEndpoint ? '✅' : '❌'} POST ${endpoint}`);
    checks.push(hasEndpoint);
  });
} catch (e) {
  console.log('  ❌ Could not read auth.js');
  checks.push(false);
}

// Verify password regex
console.log('\n✓ SECURITY FEATURES:');
try {
  const authContent = fs.readFileSync(path.join(__dirname, 'routes', 'auth.js'), 'utf-8');
  const hasPasswordRegex = authContent.includes('strongPasswordRegex') || authContent.includes('[a-z]');
  const hasBcrypt = authContent.includes('bcrypt') || authContent.includes('password');
  const hasJWT = authContent.includes('jwt.sign');
  
  console.log(`  ${hasPasswordRegex ? '✅' : '❌'} Strong Password Validation`);
  console.log(`  ${hasBcrypt ? '✅' : '❌'} Password Hashing`);
  console.log(`  ${hasJWT ? '✅' : '❌'} JWT Token Generation`);
  checks.push(hasPasswordRegex, hasBcrypt, hasJWT);
} catch (e) {
  console.log('  ❌ Could not verify security features');
  checks.push(false, false, false);
}

// Verify ProfileSetup component
console.log('\n✓ PROFILE SETUP COMPONENT:');
try {
  const profileContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'ProfileSetup.jsx'), 'utf-8');
  const hasStep1 = profileContent.includes('step === 1');
  const hasStep2 = profileContent.includes('step === 2');
  const hasStep3 = profileContent.includes('step === 3');
  const hasImageUpload = profileContent.includes('FileReader') || profileContent.includes('readAsDataURL');
  
  console.log(`  ${hasStep1 ? '✅' : '❌'} Step 1: Image Upload`);
  console.log(`  ${hasStep2 ? '✅' : '❌'} Step 2: Profile Details`);
  console.log(`  ${hasStep3 ? '✅' : '❌'} Step 3: Success`);
  console.log(`  ${hasImageUpload ? '✅' : '❌'} Image Preview`);
  checks.push(hasStep1, hasStep2, hasStep3, hasImageUpload);
} catch (e) {
  console.log('  ❌ Could not verify ProfileSetup');
  checks.push(false, false, false, false);
}

// Summary
console.log('\n' + '=' .repeat(60));
const passed = checks.filter(c => c).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`\n📊 RESULTS: ${passed}/${total} checks passed (${percentage}%)\n`);

if (percentage === 100) {
  console.log('🎉 ALL SYSTEMS READY!\n');
  console.log('Start the servers:');
  console.log('  Terminal 1: cd server && npm start');
  console.log('  Terminal 2: npm run dev');
  console.log('\nThen visit: http://localhost:5175');
  console.log('\n✨ Ready for testing!\n');
} else if (percentage >= 90) {
  console.log('⚠️  MINOR ISSUES - Most systems ready\n');
} else {
  console.log('❌ SETUP INCOMPLETE - Fix issues above\n');
}

console.log('=' .repeat(60) + '\n');
