import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", ".wrangler"]);
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      htmlFiles.push(path.join(dir, entry.name));
    }
  }
}
walk(root);

const errors = [];
function checkLocalReference(fromFile, raw, attribute) {
  const value = raw.trim();
  if (!value || value.startsWith("#") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return;
  const pathname = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  if (!pathname || pathname.startsWith("/api/")) return;
  let target = pathname.startsWith("/")
    ? path.join(root, pathname.replace(/^\/+/, ""))
    : path.resolve(path.dirname(fromFile), pathname);
  if (pathname.endsWith("/")) target = path.join(target, "index.html");
  if (!fs.existsSync(target)) {
    errors.push(`${path.relative(root, fromFile)}: missing ${attribute}="${value}"`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/\b(href|src)\s*=\s*["']([^"']+)["']/gi)) {
    checkLocalReference(file, match[2], match[1].toLowerCase());
  }
  let inlineIndex = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    const code = match[2].trim();
    if (!code) continue;
    inlineIndex += 1;
    try {
      new vm.Script(code, { filename: `${path.relative(root, file)} inline script ${inlineIndex}` });
    } catch (error) {
      errors.push(`${path.relative(root, file)} inline script ${inlineIndex}: ${error.message}`);
    }
  }
}

if (errors.length) {
  console.error("Site validation failed:");
  for (const error of errors) console.error("- " + error);
  process.exitCode = 1;
} else {
  console.log(`Validated ${htmlFiles.length} HTML files: local links and inline JavaScript syntax passed.`);
}
