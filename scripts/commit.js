import { exec, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

let commands = [
  "git add .", 
  `git commit -m "update:auto"`, 
  "git push origin main",
];

try {
  execSync(commands.join(" && "));
} catch(err) {
  console.error(err);
  process.exit(1);
}