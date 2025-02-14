import { collectCheckpoints } from "../index.js";

try {
  await collectCheckpoints("month", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}