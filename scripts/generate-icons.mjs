import sharp from "sharp";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");

await mkdir(outDir, { recursive: true });

// SVG icon: terracotta circle background + cream fork & knife silhouette
function makeIconSvg(size, safeZone = 1.0) {
  const r = (size / 2) * safeZone;
  const cx = size / 2;
  const cy = size / 2;
  // Simple R letterform for RecipeScheduler
  const scale = r / 96;
  const tx = cx - 96 * scale * 0.5;
  const ty = cy - 96 * scale * 0.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#C85A3E" rx="${size * 0.2}"/>
  <g transform="translate(${tx}, ${ty}) scale(${scale})">
    <!-- Fork -->
    <g fill="#FAF7F2" stroke="none">
      <rect x="30" y="12" width="6" height="30" rx="3"/>
      <rect x="42" y="12" width="6" height="30" rx="3"/>
      <rect x="54" y="12" width="6" height="30" rx="3"/>
      <path d="M30 42 Q45 52 60 42 L60 56 Q45 66 30 56 Z"/>
      <rect x="42" y="56" width="6" height="36" rx="3"/>
    </g>
    <!-- Knife -->
    <g fill="#FAF7F2" stroke="none">
      <rect x="78" y="12" width="6" height="72" rx="3"/>
      <path d="M84 12 Q96 28 96 42 L84 42 Z" fill="#FAF7F2"/>
    </g>
  </g>
</svg>`;
}

const sizes = [
  { name: "icon-192.png", size: 192, safeZone: 1.0 },
  { name: "icon-512.png", size: 512, safeZone: 1.0 },
  { name: "maskable-512.png", size: 512, safeZone: 0.8 },
];

for (const { name, size, safeZone } of sizes) {
  const svg = Buffer.from(makeIconSvg(size, safeZone));
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, name));
  console.log(`Generated public/icons/${name}`);
}

console.log("Done.");
