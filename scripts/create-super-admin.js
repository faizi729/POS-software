/**
 * Create a Super Admin (PlatformUser) for the platform.
 *
 * Usage (PowerShell):
 *   $env:SA_EMAIL="admin@yourcompany.com"
 *   $env:SA_PASSWORD="use-a-strong-password-12+"
 *   $env:SA_NAME="Admin"
 *   $env:SA_ROLE="super_admin"   # optional: super_admin | support | finance | read_only
 *   node scripts/create-super-admin.js
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

async function main() {
  // Local convenience: load .env if present; fallback to env.example (dev only).
  loadEnvFileIfPresent(".env");
  loadEnvFileIfPresent("env.example");

  const mongoUri = requireEnv("MONGODB_URI");
  const dbName = (process.env.MONGODB_DB || "restaurant-pos").trim();

  const email = requireEnv("SA_EMAIL").toLowerCase();
  const password = requireEnv("SA_PASSWORD");
  const name = (process.env.SA_NAME || "Super Admin").trim();
  const reset = String(process.env.SA_RESET || "").trim().toLowerCase() === "true";
  const role = unquoteEnvValue(process.env.SA_ROLE || "super_admin");
  const allowedRoles = ["super_admin", "support", "finance", "read_only"];
  if (!allowedRoles.includes(role)) {
    throw new Error(`SA_ROLE must be one of: ${allowedRoles.join(", ")}`);
  }

  if (password.length < 12) {
    throw new Error("SA_PASSWORD too short. Use 12+ characters.");
  }

  await mongoose.connect(mongoUri, { dbName });

  const PlatformUser =
    mongoose.models.PlatformUser ||
    mongoose.model(
      "PlatformUser",
      new mongoose.Schema(
        {
          email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
          name: { type: String, required: true, trim: true },
          passwordHash: { type: String, required: true },
          role: {
            type: String,
            enum: ["super_admin", "support", "finance", "read_only"],
            required: true,
            index: true,
            default: "super_admin"
          },
          status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
          lastLoginAt: Date
        },
        { timestamps: true }
      )
    );

  const exists = await PlatformUser.findOne({ email }).lean();
  if (exists && !reset) {
    console.log(`[super-admin] already exists: ${email} (set SA_RESET=true to reset password)`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  if (exists && reset) {
    await PlatformUser.updateOne(
      { email },
      { $set: { passwordHash, status: "active", role, name } }
    );
    console.log(`[super-admin] password reset: ${email}`);
    return;
  }

  await PlatformUser.create({ email, name, passwordHash, role, status: "active" });
  console.log(`[super-admin] created: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

