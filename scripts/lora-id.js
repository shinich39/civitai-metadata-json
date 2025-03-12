import { collectLoras } from "../index.js";

try {
  await collectLoras("", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}