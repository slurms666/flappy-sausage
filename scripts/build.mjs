import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distDir = path.join(root, "dist");
const cleanOnly = process.argv.includes("--clean");
const entriesToCopy = ["index.html", "styles.css", "game.js", "assets"];

await rm(distDir, { recursive: true, force: true });

if (cleanOnly) {
  process.stdout.write("Cleaned dist\n");
  process.exit(0);
}

await mkdir(distDir, { recursive: true });

for (const entry of entriesToCopy) {
  const source = path.join(root, entry);
  const target = path.join(distDir, entry);
  const sourceStat = await stat(source);

  if (sourceStat.isDirectory()) {
    await cp(source, target, { recursive: true });
    continue;
  }

  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target);
}

const copied = await readdir(distDir);
process.stdout.write(`Built dist with: ${copied.join(", ")}\n`);
