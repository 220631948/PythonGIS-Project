/**
 * Verification Script for Deployment
 * Checks if the build artifacts exist and are ready for shipping.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, '../static'); // vite output is ../static

console.log('🔍 Starting Smoke Test...');
console.log(`📂 Checking build directory: ${DIST_DIR}`);

if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found! Run "npm run build" first.');
    process.exit(1);
}

const _requiredFiles = [
    'index.html',
    'sw.js',
    'manifest.webmanifest' // vite-plugin-pwa usually generates this or uses manifest.json
];

// Check index.html
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.log('✅ index.html found');
} else {
    console.error('❌ index.html missing!');
    process.exit(1);
}

// Check Service Worker
if (fs.existsSync(path.join(DIST_DIR, 'sw.js'))) {
    console.log('✅ Service Worker (sw.js) found');
} else {
    console.error('❌ sw.js missing! PWA generation failed.');
    process.exit(1);
}

// Check Manifest
// Note: manifest might be named manifest.webmanifest or manifest.json depending on config
const manifestJson = fs.existsSync(path.join(DIST_DIR, 'manifest.json'));
const manifestWeb = fs.existsSync(path.join(DIST_DIR, 'manifest.webmanifest'));

if (manifestJson || manifestWeb) {
    console.log(`✅ Manifest found (${manifestJson ? 'manifest.json' : 'manifest.webmanifest'})`);
} else {
    console.warn('⚠️ No manifest file found in output. PWA might not be installable.');
}

console.log('\n🚀 Ready for Cape Town! Deploy at will.');
process.exit(0);
