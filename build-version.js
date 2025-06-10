#!/usr/bin/env node

/**
 * Build script to ensure version consistency across all files
 * Usage: node build-version.js
 * 
 * This script reads the version from package.json and ensures all files
 * are updated to use dynamic version loading instead of hardcoded versions.
 */

const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`Current version: ${version}`);

// Check if all files are properly configured for dynamic version loading
let issuesFound = false;

// Check index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
if (indexHtml.includes('version-number">1.') || indexHtml.includes('version-number">' + version)) {
    console.warn('⚠️  index.html contains hardcoded version. It should use "loading..." as placeholder.');
    issuesFound = true;
} else {
    console.log('✅ index.html is properly configured for dynamic version loading');
}

// Check renderer.js
const rendererJs = fs.readFileSync('renderer.js', 'utf8');
if (rendererJs.includes('|| \'1.') || rendererJs.includes('|| \'' + version)) {
    console.warn('⚠️  renderer.js contains hardcoded version fallback. It should rely on window.appVersion.');
    issuesFound = true;
} else {
    console.log('✅ renderer.js is properly configured for dynamic version loading');
}

// Check main.js
const mainJs = fs.readFileSync('main.js', 'utf8');
if (mainJs.includes('require(\'./package.json\')') && mainJs.includes('window.appVersion')) {
    console.log('✅ main.js is properly configured to inject version from package.json');
} else {
    console.warn('⚠️  main.js might not be properly configured for version injection');
    issuesFound = true;
}

if (issuesFound) {
    console.log('\n❌ Some issues found. Please ensure all files use dynamic version loading.');
    console.log('The version should only be defined in package.json.');
    process.exit(1);
} else {
    console.log('\n✅ All files are properly configured for centralized version management!');
    console.log(`Version ${version} will be automatically used everywhere.`);
}
