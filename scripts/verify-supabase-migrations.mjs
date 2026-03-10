import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, "supabase", "migrations");
const defaultRefFile = path.join(projectRoot, "supabase", ".temp", "project-ref");

const requiredMigrations = [
  "20260220_product_memberships.sql",
  "20260221_visuales_accounts.sql",
  "20260222_dev_studio_commits.sql",
  "20260227_dev_projects.sql",
];

const parseRefs = () => {
  const fromEnv = (process.env.SUPABASE_PROJECT_REFS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((pair) => {
      const [name, ref] = pair.split("=");
      return { name: (name ?? "").trim(), ref: (ref ?? "").trim() };
    })
    .filter((item) => item.name && item.ref);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  if (fs.existsSync(defaultRefFile)) {
    const ref = fs.readFileSync(defaultRefFile, "utf8").trim();
    if (ref) {
      return [{ name: "default", ref }];
    }
  }

  return [];
};

if (!fs.existsSync(migrationsDir)) {
  console.error("[verify-migrations] Missing directory:", migrationsDir);
  process.exit(1);
}

const localFiles = new Set(fs.readdirSync(migrationsDir));
const missing = requiredMigrations.filter((file) => !localFiles.has(file));

console.log("[verify-migrations] Required files:");
for (const file of requiredMigrations) {
  const status = localFiles.has(file) ? "OK" : "MISSING";
  console.log(`- ${status} ${file}`);
}

if (missing.length > 0) {
  console.error("[verify-migrations] Missing required migration files.");
  process.exit(1);
}

const refs = parseRefs();
if (refs.length === 0) {
  console.log(
    "[verify-migrations] No linked env refs found. Set SUPABASE_PROJECT_REFS='dev=<ref>,prod=<ref>' to print apply commands."
  );
  process.exit(0);
}

console.log("\n[verify-migrations] Environment commands:");
for (const env of refs) {
  console.log(`\n# ${env.name}`);
  console.log(`supabase link --project-ref ${env.ref}`);
  console.log("supabase migration list");
  console.log("supabase db push");
}
