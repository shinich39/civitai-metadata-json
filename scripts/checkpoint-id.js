import { collectCheckpoints } from "../index.js";

try {
  await collectCheckpoints("317902", true);
} catch(err) {
  console.error(err);
  process.exit(1);
}