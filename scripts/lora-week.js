import { collectLoras } from "../index.js";

try {
  await collectLoras("week", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}