const { execSync } = require('child_process');
try {
  console.log('Deploying via Firebase...');
  execSync('npx firebase-tools deploy --only hosting', { stdio: 'inherit' });
} catch (e) {
  console.error('Firebase deploy failed:', e.message);
}
