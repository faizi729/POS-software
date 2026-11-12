/**
 * List restaurant owners / reset a restaurant (tenant) user password directly in MongoDB.
 *
 * Use this when the "Forgot password" email flow is unavailable or when you need
 * instant owner access. Passwords are hashed exactly like the app does it:
 * bcrypt (bcryptjs) with 10 salt rounds — see lib/auth/password.ts.
 *
 * Usage (PowerShell):
 *   node scripts/reset-owner-password.js --list
 *   node scripts/reset-owner-password.js --slug=my-resto --email=owner@resto.com --password="NewPassw0rd!"
 *
 * Flags:
 *   --list                       Show every restaurant (slug) and its users, then exit.
 *   --email=<email>              User email to reset (required for reset).
 *   --password=<plain>           New password, min 8 chars (or set NEW_PASSWORD env var).
 *   --slug=<restaurant-slug>     Restaurant/workspace slug (optional if the email is unique).
 *   --stay-disabled              Keep the user's current status instead of activating it.
 *   --disable-2fa                Turn off email-OTP 2FA for this user (sign in with password only).
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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

function requireEnv(key) {
  const v = (process.env[key] || "").trim();
  if (!v) throw new Error(`Missing ${key}`);
  return v;
}

/** Parse `--key=value` / `--key value` / `--flag` into a map. */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = "true";
      }
    }
  }
  return out;
}

async function listTenants(db) {
  const restaurants = await db
    .collection("restaurants")
    .find({}, { projection: { name: 1, slug: 1, status: 1, createdAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();

  if (restaurants.length === 0) {
    console.log("[owner-reset] No restaurants found in this database.");
    return;
  }

  const users = await db
    .collection("users")
    .find({}, { projection: { restaurantId: 1, email: 1, role: 1, status: 1, twoFactorEnabled: 1 } })
    .toArray();

  const byRestaurant = new Map();
  for (const u of users) {
    const key = String(u.restaurantId);
    if (!byRestaurant.has(key)) byRestaurant.set(key, []);
    byRestaurant.get(key).push(u);
  }

  const roleOrder = { owner: 0, manager: 1, cashier: 2, staff: 3 };

  console.log(`\n[owner-reset] ${restaurants.length} restaurant(s) in database\n`);
  for (const r of restaurants) {
    const list = (byRestaurant.get(String(r._id)) || []).sort(
      (a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)
    );
    console.log(`Restaurant: ${r.name}`);
    console.log(`  slug   : ${r.slug}`);
    console.log(`  status : ${r.status || "active"}`);
    if (list.length === 0) {
      console.log("  users  : (none)");
    } else {
      console.log("  users  :");
      for (const u of list) {
        const otp = u.twoFactorEnabled ? ", email-OTP 2FA ON" : "";
        console.log(`    - ${u.email}  [${u.role}, ${u.status || "active"}${otp}]`);
      }
    }
    console.log("");
  }
  console.log(
    'Reset: node scripts/reset-owner-password.js --slug=<slug> --email=<email> --password="<new-password>"\n'
  );
}

async function resetPassword(db, args) {
  const email = String(args.email || "").trim().toLowerCase();
  const plain = String(args.password || process.env.NEW_PASSWORD || "");
  const slug = String(args.slug || "").trim().toLowerCase();

  if (!email) throw new Error("Missing --email=<user email>");
  if (!plain) throw new Error("Missing --password=<new password> (or NEW_PASSWORD env var)");
  if (plain.length < 8) throw new Error("Password too short. Use at least 8 characters.");

  let restaurantFilter = {};
  if (slug) {
    const restaurant = await db.collection("restaurants").findOne({ slug });
    if (!restaurant) {
      throw new Error(`No restaurant with slug "${slug}". Run with --list to see valid slugs.`);
    }
    restaurantFilter = { restaurantId: restaurant._id };
  }

  const matches = await db.collection("users").find({ email, ...restaurantFilter }).toArray();
  if (matches.length === 0) {
    const where = slug ? ` in restaurant "${slug}"` : "";
    throw new Error(`No user with email "${email}"${where}. Run with --list to see existing users.`);
  }
  if (matches.length > 1) {
    const rests = await db
      .collection("restaurants")
      .find({ _id: { $in: matches.map((m) => m.restaurantId) } }, { projection: { slug: 1 } })
      .toArray();
    throw new Error(
      `Email "${email}" exists in ${matches.length} workspaces (${rests
        .map((r) => r.slug)
        .join(", ")}). Re-run with --slug=<slug>.`
    );
  }

  const user = matches[0];
  const passwordHash = await bcrypt.hash(plain, await bcrypt.genSalt(10));

  const update = {
    $set: { passwordHash, updatedAt: new Date() },
    $unset: {
      passwordResetTokenHash: 1,
      passwordResetExpires: 1,
      twoFactorOtpHash: 1,
      twoFactorOtpExpires: 1
    }
  };
  if (String(args["stay-disabled"] || "") !== "true") {
    update.$set.status = "active";
  }
  if (String(args["disable-2fa"] || "") === "true") {
    update.$set.twoFactorEnabled = false;
  }

  await db.collection("users").updateOne({ _id: user._id }, update);

  const restaurant = await db
    .collection("restaurants")
    .findOne({ _id: user.restaurantId }, { projection: { name: 1, slug: 1 } });

  console.log("\n[owner-reset] Password updated");
  console.log(`  user       : ${user.email}`);
  console.log(`  role       : ${user.role}`);
  console.log(`  status     : ${update.$set.status || user.status || "active"}`);
  console.log(
    `  restaurant : ${restaurant ? `${restaurant.name} (slug: ${restaurant.slug})` : String(user.restaurantId)}`
  );
  console.log(`  password   : ${plain}`);
  console.log("\nSign in at /login with the workspace slug, this email, and the new password.\n");
}

async function main() {
  loadEnvFileIfPresent(".env");
  loadEnvFileIfPresent("env.example");

  const args = parseArgs(process.argv.slice(2));
  const mongoUri = requireEnv("MONGODB_URI");
  const dbName = (process.env.MONGODB_DB || "restaurant-pos").trim();

  await mongoose.connect(mongoUri, { dbName });
  const db = mongoose.connection.db;
  if (!db) throw new Error("Mongo connection has no database handle");

  const wantsReset = Boolean(args.email);
  const wantsList = Boolean(args.list) || !wantsReset;

  if (wantsList) {
    await listTenants(db);
  }
  if (wantsReset) {
    await resetPassword(db, args);
  }
}

main()
  .then(async () => {
    // Close the connection and let the process end naturally; calling process.exit()
    // here would truncate piped stdout on Windows.
    await mongoose.disconnect().catch(() => {});
  })
  .catch(async (err) => {
    console.error(`[owner-reset] ${err?.message || err}`);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
