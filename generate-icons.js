#!/usr/bin/env node
/**
 * MajiSmart Icon Generator (Node.js)
 * Generates PWA icons using pure JavaScript
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG template for MajiSmart icon
function createSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0891b2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)" rx="64"/>
  <path d="M256 80c0 0-120 160-120 240a120 120 0 0 0 240 0c0-80-120-240-120-240z" fill="white"/>
</svg>`;
}

// Simple PNG encoder (minimal implementation)
function createPNG(size) {
  // For now, we'll create SVG files which work perfectly for PWAs
  // Modern browsers support SVG icons in manifests
  const svg = createSVG(size);
  return Buffer.from(svg, 'utf-8');
}

function main() {
  console.log('\n' + '='.repeat(60));
  console.log('MajiSmart PWA Icon Generator');
  console.log('='.repeat(60) + '\n');

  const iconsDir = path.join(__dirname, 'public', 'icons');
  
  // Create directory
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`✅ Created directory: ${iconsDir}\n`);
  }

  // Generate icons
  let successCount = 0;
  ICON_SIZES.forEach(size => {
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    try {
      const svg = createSVG(size);
      fs.writeFileSync(filepath, svg, 'utf-8');
      console.log(`✅ Created: ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error creating ${filename}:`, error.message);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully created ${successCount}/${ICON_SIZES.length} icons`);
  console.log('='.repeat(60));
  console.log(`\n📁 Icons saved to: ${iconsDir}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Commit the icons: git add public/icons/');
  console.log('   2. Commit message: git commit -m "Add PWA icons"');
  console.log('   3. Push: git push');
  console.log('\n✨ Your PWA is now installable!\n');
}

main();
