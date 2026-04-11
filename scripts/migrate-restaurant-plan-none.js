/**
 * One-time: normalize legacy Restaurant.plan so dashboards match reality.
 *
 * 1) Missing/null/empty plan → "none"
 * 2) plan "growth" with no Razorpay subscription → "none" (old schema default was growth)
 *
 * Run after deploying code that adds `none` to the plan enum:
 *   node scripts/migrate-restaurant-plan-none.js
 *
 * Uses MONGODB_URI + MONGODB_DB from .env (same as create-super-admin).
 */

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

function unquoteEnvValue(value) {
  const v = String(value).trim();
  if (v.length >= 2) {
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
  }
  return v;
}

function loadEnvFileIfPresent(fileName) {
  try {
    const p = path.join(process.cwd(), fileName);
    if (!fs.existsSync(p)) return;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = unquoteEnvValue(trimmed.slice(eq + 1));
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

async function main() {
  loadEnvFileIfPresent(".env");
  loadEnvFileIfPresent("env.example");

  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) throw new Error("Missing MONGODB_URI");
  const dbName = (process.env.MONGODB_DB || "restaurant-pos").trim();

  const client = new MongoClient(uri);
  await client.connect();
  const coll = client.db(dbName).collection("restaurants");

  const missing = await coll.updateMany(
    { $or: [{ plan: { $exists: false } }, { plan: null }, { plan: "" }] },
    { $set: { plan: "none" } }
  );
  console.log(`[migrate-plan] set plan=none for missing/null/empty: ${missing.modifiedCount} docs`);

  const growthNoSub = await coll.updateMany(
    {
      plan: "growth",
      $or: [
        { razorpaySubscriptionId: { $exists: false } },
        { razorpaySubscriptionId: null },
        { razorpaySubscriptionId: "" }
      ]
    },
    { $set: { plan: "none" } }
  );
  console.log(`[migrate-plan] growth → none (no Razorpay subscription id): ${growthNoSub.modifiedCount} docs`);

  await client.close();
  console.log("[migrate-plan] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
