import bcrypt from "bcrypt";

const hash = await bcrypt.hash("vijeshwar260207", 10);
console.log(hash);
