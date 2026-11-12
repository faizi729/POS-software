import mongoose, { type ClientSession } from "mongoose";

/**
 * Runs `work` inside a MongoDB transaction when the deployment supports it
 * (Atlas / any replica set), and falls back to a plain run on standalone Mongo.
 *
 * The fallback only triggers when the transaction cannot even start, so `work`
 * never executes twice.
 */
export async function withTransaction<T>(work: (session: ClientSession | null) => Promise<T>): Promise<T> {
  let session: ClientSession | null = null;

  try {
    session = await mongoose.startSession();
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result as T;
  } catch (error) {
    if (isTransactionsUnsupported(error)) {
      if (session) await session.endSession().catch(() => {});
      // Production must never silently lose transactional guarantees.
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "MongoDB transactions are unavailable in production (deploy a replica set). Refusing to write without them."
        );
      }
      return work(null);
    }
    throw error;
  } finally {
    if (session) await session.endSession().catch(() => {});
  }
}

function isTransactionsUnsupported(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(message) ||
    /does not support transactions/i.test(message) ||
    /Transactions are not supported/i.test(message) ||
    (typeof error === "object" && error !== null && (error as { code?: number }).code === 20)
  );
}
