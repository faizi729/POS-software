/**
 * Seeds one demo hotel tenant (POS + Rooms + Banquet).
 *
 *   npm run hotel:seed
 *
 * Idempotent: re-running replaces the demo tenant's hotel data.
 * Login: slug "hotel-demo" · hotel@demo.local · DemoPass123!
 */
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const SLUG = "hotel-demo";
const EMAIL = "hotel@demo.local";
const PASSWORD = "DemoPass123!";
const DAY = 86_400_000;

function loadEnv() {
  const file = path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const today = () => new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
const addDays = (date, days) => new Date(date.getTime() + days * DAY);

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || "restaurant-pos" });
  const db = mongoose.connection.db;

  const restaurants = db.collection("restaurants");
  const users = db.collection("users");

  const existing = await restaurants.findOne({ slug: SLUG });
  const restaurantId = existing
    ? existing._id
    : (
        await restaurants.insertOne({
          name: "Hotel Demo",
          slug: SLUG,
          status: "active",
          plan: "growth",
          timezone: "Asia/Kolkata",
          currency: "INR",
          enabledModules: ["pos", "rooms", "banquet"],
          features: { websiteSync: true, aiFeatures: true, whatsappOrdering: true, qrOrdering: true },
          settings: {
            orderPrefix: "HOT",
            checkInTime: "14:00",
            checkOutTime: "11:00",
            invoicePrefix: "HOT",
            gstSlabs: [
              { uptoPaise: 750000, percent: 12 },
              { uptoPaise: 9999999999, percent: 18 }
            ],
            cancellation: { freeUntilHours: 24, chargeNights: 1, chargePercent: 0 },
            gstEnabled: true,
            gstRatePercent: 5
          },
          onboarding: { menuImported: true, receiptTemplateSaved: true, completedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).insertedId;

  await restaurants.updateOne(
    { _id: restaurantId },
    {
      $set: {
        enabledModules: ["pos", "rooms", "banquet"],
        "onboarding.menuImported": true,
        "onboarding.receiptTemplateSaved": true,
        "onboarding.completedAt": new Date()
      }
    }
  );

  const ownerExists = await users.findOne({ restaurantId, email: EMAIL });
  if (!ownerExists) {
    await users.insertOne({
      restaurantId,
      name: "Hotel Owner",
      email: EMAIL,
      passwordHash: await bcrypt.hash(PASSWORD, await bcrypt.genSalt(10)),
      role: "owner",
      status: "active",
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // ── light index migration (idempotent) ──
  await db.collection("customers").dropIndex("restaurantId_1_phone_1").catch(() => {});
  const indexJobs = [
    db.collection("customers").createIndex(
      { restaurantId: 1, phone: 1 },
      { unique: true, partialFilterExpression: { phone: { $type: "string" } }, name: "restaurantId_1_phone_1" }
    ),
    db.collection("roomnights").createIndex({ restaurantId: 1, roomId: 1, date: 1 }, { unique: true }),
    db.collection("hallslots").createIndex({ restaurantId: 1, hallId: 1, date: 1, slot: 1 }, { unique: true }),
    db.collection("folios").createIndex(
      { restaurantId: 1, invoiceNumber: 1 },
      { unique: true, partialFilterExpression: { invoiceNumber: { $type: "string" } } }
    ),
    db.collection("hotelpayments").createIndex(
      { restaurantId: 1, idempotencyKey: 1 },
      { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
    ),
    db.collection("invoicecounters").createIndex({ restaurantId: 1, scope: 1, fy: 1 }, { unique: true })
  ];
  await Promise.all(indexJobs.map((job) => job.catch(() => {})));

  for (const name of [
    "rateplans",
    "maintenancetickets",
    "businessdates",
    "roomnights",
    "hallslots",
    "hotelpayments",
    "invoicecounters",
    "foliocharges",
    "folios",
    "reservations",
    "housekeepingtasks",
    "banquetbookings",
    "rooms",
    "roomtypes",
    "halls",
    "customers"
  ]) {
    await db.collection(name).deleteMany({ restaurantId });
  }

  const insert = async (name, docs) => (await db.collection(name).insertMany(docs)).insertedIds;
  const stamp = () => ({ createdAt: new Date(), updatedAt: new Date() });

  const typeIds = await insert("roomtypes", [
    { restaurantId, name: "Deluxe", baseRate: 3000, maxOccupancy: 2, amenities: ["AC", "TV"], gstPercent: 12, ...stamp() },
    { restaurantId, name: "Suite", baseRate: 5500, maxOccupancy: 3, amenities: ["AC", "TV", "Balcony"], gstPercent: 12, ...stamp() }
  ]);

  const roomIds = await insert("rooms", [
    { restaurantId, number: "101", floor: 1, roomTypeId: typeIds[0], status: "occupied", ...stamp() },
    { restaurantId, number: "102", floor: 1, roomTypeId: typeIds[0], status: "available", ...stamp() },
    { restaurantId, number: "103", floor: 1, roomTypeId: typeIds[0], status: "dirty", ...stamp() },
    { restaurantId, number: "201", floor: 2, roomTypeId: typeIds[1], status: "available", ...stamp() },
    { restaurantId, number: "202", floor: 2, roomTypeId: typeIds[1], status: "available", ...stamp() }
  ]);

  const hallIds = await insert("halls", [
    { restaurantId, name: "Grand Hall", capacity: 300, baseRate: 60000, setupTypes: ["banquet", "theatre"], ...stamp() },
    { restaurantId, name: "Garden Lawn", capacity: 150, baseRate: 35000, setupTypes: ["buffet"], ...stamp() }
  ]);

  const guestIds = await insert("customers", [
    {
      restaurantId,
      name: "Ravi Sharma",
      phone: "9800000001",
      email: "ravi@example.com",
      idType: "Aadhaar",
      idNumber: "XXXX1234",
      loyaltyPoints: 0,
      totalVisits: 0,
      totalSpent: 0,
      ...stamp()
    },
    {
      restaurantId,
      name: "Neha Verma",
      phone: "9800000002",
      email: "neha@example.com",
      idType: "Passport",
      idNumber: "P1234567",
      loyaltyPoints: 0,
      totalVisits: 0,
      totalSpent: 0,
      ...stamp()
    }
  ]);

  const start = today();

  // Rate plans: weekday base, weekend, and a dated promo with a discount code.
  await insert("rateplans", [
    {
      restaurantId,
      name: "Standard",
      roomTypeId: typeIds[0],
      baseRatePaise: 300000,
      includedAdults: 2,
      includedChildren: 0,
      extraAdultPaise: 50000,
      childPaise: 25000,
      mealPlan: "EP",
      minNights: 1,
      priority: 0,
      active: true,
      ...stamp()
    },
    {
      restaurantId,
      name: "Weekend",
      roomTypeId: typeIds[0],
      weekdays: [5, 6],
      baseRatePaise: 350000,
      includedAdults: 2,
      extraAdultPaise: 50000,
      mealPlan: "CP",
      mealPlanPaise: 25000,
      minNights: 1,
      priority: 5,
      active: true,
      ...stamp()
    },
    {
      restaurantId,
      name: "Monsoon offer",
      roomTypeId: typeIds[0],
      dateFrom: start,
      dateTo: addDays(start, 60),
      baseRatePaise: 270000,
      includedAdults: 2,
      discountCode: "MONSOON10",
      discountPercent: 10,
      minNights: 2,
      priority: 1,
      active: true,
      ...stamp()
    }
  ]);

  const reservationIds = await insert("reservations", [
    {
      restaurantId,
      guestId: guestIds[0],
      roomId: roomIds[0],
      checkIn: start,
      checkOut: addDays(start, 2),
      status: "checked_in",
      source: "walk_in",
      advancePaid: 200000,
      rateSnapshot: 300000,
      gstPercentSnapshot: 12,
      checkedInAt: new Date(),
      ...stamp()
    },
    {
      restaurantId,
      guestId: guestIds[1],
      roomId: roomIds[1],
      checkIn: addDays(start, 3),
      checkOut: addDays(start, 5),
      status: "confirmed",
      source: "phone",
      advancePaid: 100000,
      rateSnapshot: 300000,
      gstPercentSnapshot: 12,
      ...stamp()
    }
  ]);

  // Inventory: one row per night (unique per room + date).
  await insert("roomnights", [
    { restaurantId, roomId: roomIds[0], reservationId: reservationIds[0], date: start, ratePaise: 300000, ...stamp() },
    { restaurantId, roomId: roomIds[0], reservationId: reservationIds[0], date: addDays(start, 1), ratePaise: 300000, ...stamp() },
    { restaurantId, roomId: roomIds[1], reservationId: reservationIds[1], date: addDays(start, 3), ratePaise: 300000, ...stamp() },
    { restaurantId, roomId: roomIds[1], reservationId: reservationIds[1], date: addDays(start, 4), ratePaise: 300000, ...stamp() }
  ]);

  // Money ledger (integer paise).
  await insert("hotelpayments", [
    { restaurantId, reservationId: reservationIds[0], amountPaise: 200000, method: "cash", type: "advance", reference: "SEED-ADV-1", paidAt: new Date(), ...stamp() },
    { restaurantId, reservationId: reservationIds[1], amountPaise: 100000, method: "upi", type: "advance", reference: "SEED-ADV-2", paidAt: new Date(), ...stamp() }
  ]);

  // Group booking: two rooms, one bill (all charges land on the first folio).
  const groupId = new ObjectId().toString();
  const groupIds = await insert("reservations", [
    {
      restaurantId,
      guestId: guestIds[0],
      roomId: roomIds[2],
      checkIn: addDays(start, 6),
      checkOut: addDays(start, 8),
      status: "confirmed",
      source: "phone",
      adults: 2,
      children: 1,
      advancePaid: 600000,
      rateSnapshot: 300000,
      gstPercentSnapshot: 12,
      groupId,
      ...stamp()
    },
    {
      restaurantId,
      guestId: guestIds[0],
      roomId: roomIds[3],
      checkIn: addDays(start, 6),
      checkOut: addDays(start, 8),
      status: "confirmed",
      source: "phone",
      adults: 2,
      children: 0,
      advancePaid: 0,
      rateSnapshot: 300000,
      gstPercentSnapshot: 12,
      groupId,
      ...stamp()
    }
  ]);

  await db.collection("reservations").updateMany(
    { _id: { $in: Object.values(groupIds) } },
    { $set: { folioReservationId: groupIds[0] } }
  );

  await insert("roomnights", [
    { restaurantId, roomId: roomIds[2], reservationId: groupIds[0], date: addDays(start, 6), ratePaise: 300000, ...stamp() },
    { restaurantId, roomId: roomIds[2], reservationId: groupIds[0], date: addDays(start, 7), ratePaise: 300000, ...stamp() },
    { restaurantId, roomId: roomIds[3], reservationId: groupIds[1], date: addDays(start, 6), ratePaise: 300000, ...stamp() },
    { restaurantId, roomId: roomIds[3], reservationId: groupIds[1], date: addDays(start, 7), ratePaise: 300000, ...stamp() }
  ]);

  await insert("hotelpayments", [
    { restaurantId, reservationId: groupIds[0], amountPaise: 600000, method: "upi", type: "advance", reference: "SEED-GROUP", paidAt: new Date(), ...stamp() }
  ]);

  const folioId = (
    await db.collection("folios").insertOne({
      restaurantId,
      reservationId: reservationIds[0],
      status: "open",
      ...stamp()
    })
  ).insertedId;

  await insert("foliocharges", [
    {
      restaurantId,
      folioId,
      reservationId: reservationIds[0],
      type: "room",
      amountPaise: 300000,
      taxPercent: 12,
      taxPaise: 36000,
      description: "Room 101 night 1",
      stayDate: start,
      postedAt: new Date(),
      ...stamp()
    },
    {
      restaurantId,
      folioId,
      reservationId: reservationIds[0],
      type: "room",
      amountPaise: 300000,
      taxPercent: 12,
      taxPaise: 36000,
      description: "Room 101 night 2",
      stayDate: addDays(start, 1),
      postedAt: new Date(),
      ...stamp()
    }
  ]);

  await insert("housekeepingtasks", [
    {
      restaurantId,
      roomId: roomIds[2],
      status: "pending",
      assignee: "Housekeeping",
      note: "Checkout clean",
      ...stamp()
    }
  ]);

  const bookingIds = await insert("banquetbookings", [
    {
      restaurantId,
      hallId: hallIds[0],
      date: addDays(start, 3),
      slot: "evening",
      eventType: "Wedding reception",
      guestName: "Neha Verma",
      guestPhone: "9800000002",
      guestCount: 120,
      menuPackage: {
        items: [{ nameSnapshot: "Veg buffet", pricePerPlatePaise: 55000 }],
        perPlatePaise: 55000
      },
      addOns: [
        { name: "Decor", amountPaise: 2500000 },
        { name: "DJ", amountPaise: 1500000 }
      ],
      status: "confirmed",
      hallRatePaise: 5000000,
      subtotalPaise: 15600000,
      gstPercent: 18,
      gstPaise: 2808000,
      totalAmountPaise: 18408000,
      advancePaidPaise: 2000000,
      setupType: "Round tables",
      startTime: "19:00",
      endTime: "23:00",
      staffNotes: "Stage on the north wall, 12 staff for service.",
      ...stamp()
    }
  ]);

  await insert("hotelpayments", [
    {
      restaurantId,
      bookingId: bookingIds[0],
      amountPaise: 2000000,
      method: "bank",
      type: "advance",
      reference: "SEED-EVENT-ADV",
      paidAt: new Date(),
      ...stamp()
    }
  ]);

  // Hall inventory rows (full_day occupies both slots; seeded booking is evening).
  await insert("hallslots", [
    {
      restaurantId,
      hallId: hallIds[0],
      bookingId: bookingIds[0],
      date: addDays(start, 3),
      slot: "evening",
      ...stamp()
    }
  ]);

  console.log(`[hotel:seed] tenant ${SLUG} ready`);
  console.log(`[hotel:seed] login: ${SLUG} / ${EMAIL} / ${PASSWORD}`);
  console.log("[hotel:seed] rooms=5 halls=2 reservations=2 folioCharges=2 bookings=1");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[hotel:seed]", error?.message || error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
