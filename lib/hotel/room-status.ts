/**
 * Canonical room state for the overview. Pure (no imports) so it can be unit-tested.
 *
 * Priority matters: a guest physically in the room beats a stale `dirty`/`maintenance`
 * flag, and an open maintenance ticket beats `dirty`.
 */
export type RoomState = "occupied" | "vacant" | "dirty" | "maintenance";

export function roomState(input: {
  status?: string | null;
  inHouse?: boolean;
  openTicket?: boolean;
}): RoomState {
  if (input.inHouse) return "occupied";
  if (input.status === "occupied") return "occupied"; // drifted room flag, still not sellable
  if (input.openTicket || input.status === "maintenance") return "maintenance";
  if (input.status === "dirty") return "dirty";
  return "vacant";
}

export type RoomStateCounts = {
  total: number;
  occupied: number;
  vacant: number;
  dirty: number;
  maintenance: number;
  /** occupied / total, rounded to one decimal. */
  occupancyPercent: number;
};

export function roomStateCounts(states: RoomState[]): RoomStateCounts {
  const counts: RoomStateCounts = {
    total: states.length,
    occupied: 0,
    vacant: 0,
    dirty: 0,
    maintenance: 0,
    occupancyPercent: 0
  };

  for (const state of states) counts[state] += 1;

  counts.occupancyPercent = counts.total
    ? Math.round((counts.occupied / counts.total) * 1000) / 10
    : 0;

  return counts;
}
