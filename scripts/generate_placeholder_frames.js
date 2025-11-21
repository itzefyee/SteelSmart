#!/usr/bin/env node
/**
 * Generate placeholder wireframe frames for the rotating model
 * This creates SVG-based placeholder images that can be replaced with actual renders later
 */

const fs = require('fs');
const path = require('path');

const NUM_FRAMES = 36;
const IMAGE_SIZE = 1024;
const OUTPUT_DIR = path.join(__dirname, '../public/model-frames/brake-rotor');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate SVG wireframe for a brake rotor at a specific angle
function generateBrakeRotorSVG(angle, size = IMAGE_SIZE) {
  const center = size / 2;
  const outerRadius = size * 0.35;
  const innerRadius = size * 0.15;
  const holeRadius = size * 0.025;
  const holeOrbitRadius = size * 0.27;
  
  // Calculate 3D perspective effect based on rotation angle
  const rad = (angle * Math.PI) / 180;
  const perspectiveScale = Math.abs(Math.cos(rad)) * 0.3 + 0.7; // Scale between 0.7 and 1.0
  const skewX = Math.sin(rad) * 0.3;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066CC;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#00D4FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6B46C1;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00D4FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0066CC;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6B46C1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00D4FF;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="10" stdDeviation="20" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <g transform="translate(${center}, ${center}) scale(${perspectiveScale}, 1) skewX(${skewX * 20})">
`;

  // Outer circle
  svg += `    <circle cx="0" cy="0" r="${outerRadius}" stroke="url(#gradient1)" stroke-width="4" fill="none" filter="url(#shadow)" />\n`;
  
  // Inner circle
  svg += `    <circle cx="0" cy="0" r="${innerRadius}" stroke="url(#gradient1)" stroke-width="4" fill="none" />\n`;
  
  // Ventilation slots (12 radial lines)
  for (let i = 0; i < 12; i++) {
    const slotAngle = ((i * 30 + angle * 0.5) * Math.PI) / 180;
    const x1 = (innerRadius + 10) * Math.cos(slotAngle);
    const y1 = (innerRadius + 10) * Math.sin(slotAngle);
    const x2 = (outerRadius - 10) * Math.cos(slotAngle);
    const y2 = (outerRadius - 10) * Math.sin(slotAngle);
    
    svg += `    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#gradient2)" stroke-width="3" />\n`;
  }
  
  // Mounting holes (5 holes in a bolt circle)
  for (let i = 0; i < 5; i++) {
    const holeAngle = ((i * 72 + angle * 0.8) * Math.PI) / 180;
    const holeX = holeOrbitRadius * Math.cos(holeAngle);
    const holeY = holeOrbitRadius * Math.sin(holeAngle);
    
    svg += `    <circle cx="${holeX}" cy="${holeY}" r="${holeRadius}" stroke="url(#gradient3)" stroke-width="3" fill="rgba(255, 255, 255, 0.9)" />\n`;
  }
  
  // Center hub
  const hubRadius = size * 0.075;
  svg += `    <circle cx="0" cy="0" r="${hubRadius}" stroke="url(#gradient3)" stroke-width="4" fill="rgba(0, 212, 255, 0.08)" />\n`;
  
  // Additional detail rings
  const midRadius = (outerRadius + innerRadius) / 2;
  svg += `    <circle cx="0" cy="0" r="${midRadius}" stroke="url(#gradient1)" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="10,5" />\n`;
  
  svg += `  </g>
</svg>`;
  
  return svg;
}

// Generate all frames
console.log(`Generating ${NUM_FRAMES} placeholder frames...`);
console.log(`Output directory: ${OUTPUT_DIR}`);

for (let i = 0; i < NUM_FRAMES; i++) {
  const angle = (360 * i) / NUM_FRAMES;
  const svg = generateBrakeRotorSVG(angle);
  const filename = `brake-rotor-${String(i).padStart(3, '0')}.svg`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, svg);
  
  if ((i + 1) % 6 === 0) {
    console.log(`  Generated ${i + 1}/${NUM_FRAMES} frames...`);
  }
}

console.log(`✅ Successfully generated ${NUM_FRAMES} frames!`);
console.log(`\nNext steps:`);
console.log(`  1. Run: npm run generate-frames (to create these SVGs)`);
console.log(`  2. Optional: Convert SVGs to PNGs using ImageMagick or similar`);
console.log(`  3. Optional: Replace with actual 3D renders from Blender`);
console.log(`\nTo convert SVGs to PNGs with ImageMagick:`);
console.log(`  cd ${OUTPUT_DIR}`);
console.log(`  for i in *.svg; do convert $i -resize 1024x1024 \${i%.svg}.png; done`);









