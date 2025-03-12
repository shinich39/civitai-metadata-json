import fs from "node:fs";
import path from "node:path";

function readJson(str) {
  return JSON.parse(fs.readFileSync(str, "utf8"));
}

function writeJson(str, data) {
  return fs.writeFileSync(str, JSON.stringify(data), "utf8");
}

const ckpt = readJson("./dist/checkpoint.json");
const c = ckpt.checkpoints[2];
c.versions = [c.versions[0]];
console.log("Checkpoint");
console.log(JSON.stringify(c, null, 2));

// for (const c of ckpt.checkpoints) {
//   for (const v of c.versions) {
//     if (v.files.length === 0) {
//       console.log(v);
//     }
//   }
// }

const lora = readJson("./dist/lora.json");
const l = lora.loras[0];
l.versions = [l.versions[0]];
console.log("LORA");
console.log(JSON.stringify(l, null, 2));

// for (const l of lora.loras) {
//   for (const v of l.versions) {
//     if (v.files.length === 0) {
//       console.log(l.name, v);
//     }
//   }
// }

