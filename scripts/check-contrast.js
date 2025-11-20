/**
 * Color contrast checker for WCAG AA compliance
 * Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
 */

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(foreground, background, description, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = isLargeText ? 3.0 : 4.5;
  const passes = ratio >= minRatio;
  
  console.log(`\n${description}`);
  console.log(`  Foreground: ${foreground}`);
  console.log(`  Background: ${background}`);
  console.log(`  Contrast Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`  Required: ${minRatio}:1 (${isLargeText ? 'Large Text' : 'Normal Text'})`);
  console.log(`  Status: ${passes ? '✓ PASS' : '✗ FAIL'}`);
  
  return passes;
}

console.log('=== WCAG AA Color Contrast Check ===');

const results = [];

// 1. Heading gradient on light background (large text)
// Using the colors in the updated gradient
results.push(checkContrast('#0066CC', '#FFFFFF', '1. Heading (primary blue start) on white background', true));
results.push(checkContrast('#0077CC', '#FFFFFF', '2. Heading (middle blue) on white background', true));
results.push(checkContrast('#0066CC', '#FFFFFF', '3. Heading (primary blue end) on white background', true));

// 2. Button text on gradient background
results.push(checkContrast('#FFFFFF', '#0066CC', '4. Button text (white) on primary blue start', false));
results.push(checkContrast('#FFFFFF', '#0077CC', '5. Button text (white) on blue end', false));

// 3. Body text on light background
results.push(checkContrast('#6B7280', '#FFFFFF', '6. Body text (text-secondary) on white', false));
results.push(checkContrast('#111827', '#FFFFFF', '7. Primary text on white', false));

// 4. Specification overlay
results.push(checkContrast('#0066CC', '#FFFFFF', '8. Spec values (primary blue) on white overlay', false));
results.push(checkContrast('#6B7280', '#FFFFFF', '9. Spec labels (text-secondary) on white overlay', false));

// 5. Prompt text
results.push(checkContrast('#111827', '#FFFFFF', '10. Prompt text on white background', false));
results.push(checkContrast('#0066CC', '#FFFFFF', '11. Prompt cursor (primary blue) on white', false));

console.log('\n=== Summary ===');
const passCount = results.filter(r => r).length;
const totalCount = results.length;
console.log(`Passed: ${passCount}/${totalCount}`);

if (passCount === totalCount) {
  console.log('✓ All color combinations meet WCAG AA standards!');
  process.exit(0);
} else {
  console.log('✗ Some color combinations need adjustment.');
  process.exit(1);
}
