import { collectCheckpoints } from "../index.js";

try {
  await collectCheckpoints("all", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}