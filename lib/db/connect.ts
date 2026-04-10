import mongoose from "mongoose";
import { MenuItem } from "@/models/MenuItem";

function getMongoUri() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Please define the MONGODB_URI environment variable.");
  }

  return mongoUri;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      dbName: process.env.MONGODB_DB ?? "restaurant-pos"
    });
  }

  cached.conn = await cached.promise;

  // Ensure SKU index is partial unique (avoid E11000 on sku:null)
  // IMPORTANT: Index reconciliation can be expensive and will block the first request.
  // Run it only when explicitly enabled.
  //
  // Set DB_SYNC_INDEXES=1 when you intentionally want to sync indexes (e.g. one-off deploy job).
  if (process.env.DB_SYNC_INDEXES === "1") {
    try {
      const coll = cached.conn.connection.db?.collection("menuitems");
      if (coll) {
        const indexes = await coll.indexes();
        const skuIdx = indexes.find((i: any) => i?.key?.restaurantId === 1 && i?.key?.sku === 1 && i?.unique);
        const hasPartial = Boolean(skuIdx?.partialFilterExpression);
        if (skuIdx && !hasPartial && typeof skuIdx.name === "string") {
          await coll.dropIndex(skuIdx.name);
        }
      }
      await MenuItem.syncIndexes();
    } catch {
      // ignore
    }
  }

  return cached.conn;
}
