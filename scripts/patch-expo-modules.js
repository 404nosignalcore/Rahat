const fs = require('fs');
const path = require('path');

function patchFile(filePath, searchStr, replaceStr) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[Rahat] Patched:', path.basename(filePath));
  }
}

// 1. Patch polyfill/index.js
const polyfillPath = path.join(__dirname, '../node_modules/expo-modules-core/build/polyfill/index.js');
if (fs.existsSync(polyfillPath)) {
  const content = fs.readFileSync(polyfillPath, 'utf8');
  if (!content.includes('installExpoGlobalPolyfill')) {
    fs.writeFileSync(polyfillPath, "import { installExpoGlobalPolyfill } from './dangerous-internal';\ninstallExpoGlobalPolyfill();\n", 'utf8');
    console.log('[Rahat] Patched: polyfill/index.js');
  }
}

// 2. Patch EventEmitter.js
const eePath = path.join(__dirname, '../node_modules/expo-modules-core/build/EventEmitter.js');
if (fs.existsSync(eePath)) {
  let content = fs.readFileSync(eePath, 'utf8');
  if (!content.includes('installExpoGlobalPolyfill')) {
    content = "'use client';\nimport { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';\nimport { installExpoGlobalPolyfill } from './polyfill/dangerous-internal';\nensureNativeModulesAreInstalled();\nif (!globalThis.expo) {\n    installExpoGlobalPolyfill();\n}\nexport const EventEmitter = globalThis.expo.EventEmitter;\n";
    fs.writeFileSync(eePath, content, 'utf8');
    console.log('[Rahat] Patched: EventEmitter.js');
  }
}

// 3. Patch NativeModule.js
const nmPath = path.join(__dirname, '../node_modules/expo-modules-core/build/NativeModule.js');
if (fs.existsSync(nmPath)) {
  let content = fs.readFileSync(nmPath, 'utf8');
  if (!content.includes('installExpoGlobalPolyfill')) {
    content = "'use client';\nimport { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';\nimport { installExpoGlobalPolyfill } from './polyfill/dangerous-internal';\nensureNativeModulesAreInstalled();\nif (!globalThis.expo) {\n    installExpoGlobalPolyfill();\n}\nexport const NativeModule = globalThis.expo.NativeModule;\n";
    fs.writeFileSync(nmPath, content, 'utf8');
    console.log('[Rahat] Patched: NativeModule.js');
  }
}

// 4. Patch SharedObject.js
const soPath = path.join(__dirname, '../node_modules/expo-modules-core/build/SharedObject.js');
if (fs.existsSync(soPath)) {
  let content = fs.readFileSync(soPath, 'utf8');
  if (!content.includes('installExpoGlobalPolyfill')) {
    content = "'use client';\nimport { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';\nimport { installExpoGlobalPolyfill } from './polyfill/dangerous-internal';\nensureNativeModulesAreInstalled();\nif (!globalThis.expo) {\n    installExpoGlobalPolyfill();\n}\nexport const SharedObject = globalThis.expo.SharedObject;\n";
    fs.writeFileSync(soPath, content, 'utf8');
    console.log('[Rahat] Patched: SharedObject.js');
  }
}

// 5. Patch SharedRef.js
const srPath = path.join(__dirname, '../node_modules/expo-modules-core/build/SharedRef.js');
if (fs.existsSync(srPath)) {
  let content = fs.readFileSync(srPath, 'utf8');
  if (!content.includes('installExpoGlobalPolyfill')) {
    content = "'use client';\nimport { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';\nimport { installExpoGlobalPolyfill } from './polyfill/dangerous-internal';\nensureNativeModulesAreInstalled();\nif (!globalThis.expo) {\n    installExpoGlobalPolyfill();\n}\nexport const SharedRef = globalThis.expo.SharedRef;\n";
    fs.writeFileSync(srPath, content, 'utf8');
    console.log('[Rahat] Patched: SharedRef.js');
  }
}

console.log('[Rahat] All Expo Core native modules patched successfully.');
