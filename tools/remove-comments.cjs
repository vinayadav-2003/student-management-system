const fs = require("fs");
const path = require("path");

const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const root = process.cwd();
const targets = [
  "src",
  "server",
  "vite.config.js",
  "eslint.config.js",
  "server.js",
  "main.jsx",
  "index.js",
];

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) {
      results.push(...walk(fp));
    } else {
      const ext = path.extname(fp).toLowerCase();
      if (exts.has(ext) || [".js", ".jsx", ".ts", ".tsx"].includes(ext))
        results.push(fp);
    }
  });
  return results;
}

function collectFiles() {
  const files = new Set();
  targets.forEach((t) => {
    const p = path.join(root, t);
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p).forEach((f) => files.add(f));
      else if (stat.isFile()) files.add(p);
    }
  });
  return Array.from(files).sort();
}

function stripWholeLineComments(content) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let inBlock = false;
  for (let line of lines) {
    const trimmed = line.trim();
    if (!inBlock) {
      if (trimmed.startsWith("//")) {
        continue;
      }
      if (trimmed.startsWith("/*")) {
        if (!trimmed.includes("*/")) {
          inBlock = true;
          continue;
        } else {
          continue;
        }
      }
      out.push(line);
    } else {
      if (trimmed.includes("*/")) {
        inBlock = false;
      }
      continue;
    }
  }
  return out.join("\n");
}

const files = collectFiles();
let modified = 0;
files.forEach((f) => {
  try {
    const content = fs.readFileSync(f, "utf8");
    const stripped = stripWholeLineComments(content);
    if (stripped !== content) {
      fs.writeFileSync(f, stripped, "utf8");
      modified++;
      console.log("Modified:", path.relative(root, f));
    }
  } catch (e) {
    console.error("Error processing", f, e.message);
  }
});
console.log("Done. Files scanned:", files.length, "Modified:", modified);
