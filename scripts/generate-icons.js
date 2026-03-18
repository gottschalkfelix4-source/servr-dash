// Generate PWA icons as simple PNG files using Canvas API
// Run: node scripts/generate-icons.js

const { createCanvas } = (() => {
  try {
    return require("canvas");
  } catch {
    // Fallback: generate icons as inline SVG data URIs converted to basic files
    return null;
  }
})();

const fs = require("fs");
const path = require("path");

const sizes = [192, 512];
const outDir = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate a simple PNG with a colored background and "S" letter
// Using raw PNG creation (no dependencies needed)
function createPNG(size) {
  // Create a minimal valid PNG
  const { Buffer } = require("buffer");

  // We'll create an SVG and note that for production, real PNGs should be used
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#0a0f1e"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:0.1"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#glow)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif" font-weight="700"
    font-size="${size * 0.5}" fill="#22d3ee">S</text>
</svg>`;

  return svg;
}

for (const size of sizes) {
  const svg = createPNG(size);
  const filePath = path.join(outDir, `icon-${size}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Created ${filePath}`);
}

console.log("\nNote: SVG icons created. For production, convert to PNG using:");
console.log("  npx sharp-cli icon-192.svg -o icon-192.png");
console.log("  npx sharp-cli icon-512.svg -o icon-512.png");
console.log("\nOr use an online SVG-to-PNG converter.");
