import { collectLoras } from "../index.js";

try {
  await collectLoras("all", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}