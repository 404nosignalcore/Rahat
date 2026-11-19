const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(distDir)) {
  console.log('[Rahat] dist folder does not exist yet.');
  process.exit(0);
}

// 1. Copy favicon.ico into dist
const publicFavicon = path.join(publicDir, 'favicon.ico');
const distFavicon = path.join(distDir, 'favicon.ico');

if (fs.existsSync(publicFavicon)) {
  fs.copyFileSync(publicFavicon, distFavicon);
  console.log('[Rahat] Copied favicon.ico to dist/favicon.ico');
}

// 2. Ensure dist/index.html references favicon.ico
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('rel="icon"') && !html.includes("rel='icon'")) {
    html = html.replace('</head>', '  <link rel="icon" type="image/x-icon" href="/favicon.ico" />\n</head>');
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('[Rahat] Injected favicon.ico link into dist/index.html');
  }
}
