// Copies OpenCV.js into public/ so the app serves it from its own origin.
// Bundling the ~10MB file (it embeds the WebAssembly binary) crashes the bundler,
// so the browser loads it with a <script> tag instead (see src/lib/cardScan/opencv.ts).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

const src = require.resolve("@techstark/opencv-js");
const destDir = join(root, "public", "vendor");
mkdirSync(destDir, { recursive: true });
copyFileSync(src, join(destDir, "opencv.js"));
console.log(`Copied ${src} -> public/vendor/opencv.js`);
