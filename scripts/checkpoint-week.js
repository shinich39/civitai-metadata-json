import { collectCheckpoints } from "../index.js";

try {
  await collectCheckpoints("week", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}