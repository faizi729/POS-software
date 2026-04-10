/**
 * De-dupe MenuCategory documents that were accidentally inserted multiple times.
 *
 * This script is SAFE by default: it marks duplicates as inactive (isActive=false)
 * instead of deleting them.
 *
 * Targets:
 * - POS categories that don't use the menu builder tree (menuId missing)
 * - Duplicates determined by (restaurantId, parentId, slug)
 *
 * Usage:
 *   node scripts/dedupe-menu-categories.js
 *
 * Env:
 * - MONGODB_URI must be set (same as the app)
 */

/* eslint-disable no-console */
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);

  // Load model from compiled JS at runtime without relying on TS path aliases.
  // The app's models index is TS; requiring individual file is more robust here.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MenuCategory } = require("../models");

  console.log("Scanning for duplicate POS categories (menuId missing)...");

  const pipeline = [
    { $match: { menuId: { $exists: false }, slug: { $type: "string" } } },
    {
      $group: {
        _id: {
          restaurantId: "$restaurantId",
          parentId: "$parentId",
          slug: "$slug"
        },
        ids: { $push: "$_id" },
        createdAts: { $push: "$createdAt" },
        activeFlags: { $push: "$isActive" },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ];

  const groups = await MenuCategory.aggregate(pipeline);
  if (!groups.length) {
    console.log("No duplicates found. ✅");
    await mongoose.disconnect();
    return;
  }

  let deactivated = 0;
  for (const g of groups) {
    // Keep the oldest doc (smallest createdAt); deactivate the rest.
    const pairs = g.ids.map((id, idx) => ({ id, createdAt: g.createdAts[idx] }));
    pairs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const keepId = pairs[0].id;
    const dupIds = pairs.slice(1).map((p) => p.id);

    const res = await MenuCategory.updateMany(
      { _id: { $in: dupIds } },
      { $set: { isActive: false } }
    );
    deactivated += res.modifiedCount || 0;

    console.log(
      `- restaurant=${String(g._id.restaurantId)} parent=${String(g._id.parentId)} slug=${g._id.slug} keep=${String(
        keepId
      )} deactivated=${dupIds.length}`
    );
  }

  console.log(`Done. Deactivated ${deactivated} duplicate categories. ✅`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

