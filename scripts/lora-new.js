import { collectLoras } from "../index.js";

try {
  await collectLoras("new", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}