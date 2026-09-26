#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚡ ELAP: Intercepted Vercel Next.js preset. Redirecting to full-stack vercel-build...');
try {
  execSync('npm run vercel-build', { stdio: 'inherit' });

  // Sync dist to .next as an additional safeguard if Vercel Next.js builder checks for .next directory
  const distDir = path.resolve(__dirname, '../frontend/dist');
  const nextDir = path.resolve(__dirname, '../.next');
  if (fs.existsSync(distDir)) {
    try {
      if (!fs.existsSync(nextDir)) {
        fs.mkdirSync(nextDir, { recursive: true });
      }
      fs.cpSync(distDir, nextDir, { recursive: true });
      console.log('⚡ ELAP: Assets synchronized for Vercel deployment compatibility.');
    } catch (syncErr) {
      // Non-fatal
    }
  }
} catch (error) {
  console.error('Build execution failed:', error.message);
  process.exit(1);
}
