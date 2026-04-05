import mongoose from "mongoose";

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
    console.log("[db] using cached mongoose connection", {
      dbName: process.env.MONGODB_DB ?? "restaurant-pos"
    });
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("[db] connecting to mongodb", {
      dbName: process.env.MONGODB_DB ?? "restaurant-pos",
      hasMongoUri: Boolean(process.env.MONGODB_URI)
    });
    cached.promise = mongoose.connect(getMongoUri(), {
      dbName: process.env.MONGODB_DB ?? "restaurant-pos"
    });
  }

  cached.conn = await cached.promise;
  console.log("[db] mongoose connected", {
    readyState: cached.conn.connection.readyState,
    dbName: cached.conn.connection.db?.databaseName
  });

  return cached.conn;
}
