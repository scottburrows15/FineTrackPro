// Install required dependencies for Open Banking system
// Run: npm install node-cron lodash-es @types/lodash-es

console.log('Installing Open Banking dependencies...');

// This file documents the required dependencies for the Open Banking system:
// 
// Production dependencies:
// - node-cron: For scheduling automatic transaction sync
// - lodash-es: For utility functions (debounce, throttle)
// 
// Development dependencies:  
// - @types/lodash-es: TypeScript definitions for lodash
//
// To install these dependencies, run:
// npm install node-cron lodash-es
// npm install --save-dev @types/lodash-es

export const requiredDependencies = [
  'node-cron',
  'lodash-es'
];

export const requiredDevDependencies = [
  '@types/lodash-es'
];