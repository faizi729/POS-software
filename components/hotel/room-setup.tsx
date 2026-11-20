"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

export type SetupRoomType = {
  id: string;
  name: string;
  baseRate: number;
  maxOccupancy: number;
  gstPercent: number;
  amenities: string[];
};

export type SetupRoom = {
  id: string;
  number: string;
  floor: number;
  status: string;
  roomTypeId: string;
  roomTypeName: string;
};

const statuses = ["available", "dirty", "maintenance"] as const;

export function RoomSetup({ types, rooms }: { types: SetupRoomType[]; rooms: SetupRoom[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeName, setTypeName] = useState("");
  const [typeRate, setTypeRate] = useState("");
  const [typeGst, setTypeGst] = useState("12");
  const [typeGuests, setTypeGuests] = useState("2");
  const [typeAmenities, setTypeAmenities] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomFloor, setRoomFloor] = useState("1");
  const [roomTypeId, setRoomTypeId] = useState(types[0]?.id ?? "");
  const [addMode, setAddMode] = useState<"range" | "single">("range");
  const [bulk, setBulk] = useState({ from: "101", to: "110", floor: "1", roomTypeId: types[0]?.id ?? "" });

  async function send(key: string, url: string, method: string, body?: unknown) {
    setSaving(key);
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) {
      setError(data?.error || "Request failed");
      return false;
    }
    router.refresh();
    return true;
  }

  const fromNumber = Number(bulk.from);
  const toNumber = Number(bulk.to);
  const rangeCount =
    Number.isFinite(fromNumber) && Number.isFinite(toNumber) && toNumber >= fromNumber
      ? Math.min(toNumber - fromNumber + 1, 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Rooms</h1>
        <Button variant="secondary" size="sm" onClick={() => router.push("/rooms")}>
          Calendar
        </Button>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <section className="surface-card p-4">
        <h2 className="text-sm font-semibold text-text-primary">Room types</h2>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Type</span>
            <input
              className="mt-1 h-9 w-36 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={typeName}
              onChange={(event) => setTypeName(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Rate</span>
            <input
              type="number"
              min={0}
              className="mt-1 h-9 w-24 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={typeRate}
              onChange={(event) => setTypeRate(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">GST %</span>
            <input
              type="number"
              min={0}
              max={28}
              className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={typeGst}
              onChange={(event) => setTypeGst(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Guests</span>
            <input
              type="number"
              min={1}
              max={20}
              className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={typeGuests}
              onChange={(event) => setTypeGuests(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Amenities</span>
            <input
              className="mt-1 h-9 w-64 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              placeholder="AC, TV, Balcony"
              value={typeAmenities}
              onChange={(event) => setTypeAmenities(event.target.value)}
            />
          </label>
          <Button
            size="sm"
            disabled={saving !== null || !typeName.trim()}
            onClick={async () => {
              const done = await send("new-type", "/api/hotel/room-types", "POST", {
                name: typeName.trim(),
                baseRate: Number(typeRate) || 0,
                gstPercent: Number(typeGst) || 12,
                maxOccupancy: Number(typeGuests) || 2,
                amenities: typeAmenities
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              });
              if (done) {
                setTypeName("");
                setTypeRate("");
                setTypeAmenities("");
              }
            }}
          >
            Add type
          </Button>
        </div>
        {/* TYPES TABLE */}
        <table className="mt-3 w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="pb-2">Type</th>
              <th className="pb-2">Guests</th>
              <th className="pb-2">Rate</th>
              <th className="pb-2">GST %</th>
              <th className="pb-2">Amenities</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-text-muted" colSpan={6}>
                  No room types yet
                </td>
              </tr>
            ) : null}
            {types.map((type) => (
              <TypeRow
                key={type.id}
                type={type}
                saving={saving === type.id}
                onSave={(patch) => send(type.id, `/api/hotel/room-types/${type.id}`, "PATCH", patch)}
                onDelete={() => send(type.id, `/api/hotel/room-types/${type.id}`, "DELETE")}
              />
            ))}
          </tbody>
        </table>
      </section>

      <section className="surface-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Add rooms</h2>
          <div className="inline-flex rounded-xl border border-border-subtle p-0.5">
            {(["range", "single"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAddMode(mode)}
                className={`rounded-[10px] px-3 py-1 text-xs font-semibold transition ${
                  addMode === mode ? "bg-text-primary text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {mode === "range" ? "A range" : "One room"}
              </button>
            ))}
          </div>
        </div>

        {addMode === "single" ? (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Room number</span>
            <input
              className="mt-1 h-9 w-24 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={roomNumber}
              onChange={(event) => setRoomNumber(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Floor</span>
            <input
              type="number"
              min={0}
              className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={roomFloor}
              onChange={(event) => setRoomFloor(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Room type</span>
            <select
              className="mt-1 h-9 rounded-xl border border-border-subtle bg-white px-2.5 text-sm"
              value={roomTypeId}
              onChange={(event) => setRoomTypeId(event.target.value)}
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            disabled={saving !== null || !roomNumber.trim() || !roomTypeId}
            onClick={async () => {
              const done = await send("new-room", "/api/hotel/rooms", "POST", {
                number: roomNumber.trim(),
                floor: Number(roomFloor) || 1,
                roomTypeId
              });
              if (done) setRoomNumber("");
            }}
          >
            Add room
          </Button>
        </div>
        ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">From</span>
            <input
              type="number"
              className="mt-1 h-9 w-24 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={bulk.from}
              onChange={(event) => setBulk({ ...bulk, from: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">To</span>
            <input
              type="number"
              className="mt-1 h-9 w-24 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={bulk.to}
              onChange={(event) => setBulk({ ...bulk, to: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Floor</span>
            <input
              type="number"
              className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={bulk.floor}
              onChange={(event) => setBulk({ ...bulk, floor: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Room type</span>
            <select
              className="mt-1 h-9 rounded-xl border border-border-subtle bg-white px-2.5 text-sm"
              value={bulk.roomTypeId}
              onChange={(event) => setBulk({ ...bulk, roomTypeId: event.target.value })}
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            disabled={saving !== null || !bulk.roomTypeId || rangeCount === 0}
            onClick={() =>
              void send("bulk", "/api/hotel/rooms/bulk", "POST", {
                from: Number(bulk.from) || 0,
                to: Number(bulk.to) || 0,
                floor: Number(bulk.floor) || 1,
                roomTypeId: bulk.roomTypeId
              })
            }
          >
            {rangeCount > 0 ? `Add ${rangeCount} ${rangeCount === 1 ? "room" : "rooms"}` : "Add range"}
          </Button>
        </div>
        )}
      </section>
      {/* ROOMS */}
      <section className="surface-card overflow-x-auto p-4">
        <h2 className="text-sm font-semibold text-text-primary">Rooms ({rooms.length})</h2>
        <table className="mt-2 w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="pb-2">Room</th>
              <th className="pb-2">Floor</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-text-muted" colSpan={5}>
                  No rooms yet — add a range above
                </td>
              </tr>
            ) : null}
            {rooms.map((room) => (
              <RoomRow
                key={room.id}
                room={room}
                types={types}
                saving={saving === room.id}
                onSave={(patch) => send(room.id, `/api/hotel/rooms/${room.id}`, "PATCH", patch)}
                onDelete={() => send(room.id, `/api/hotel/rooms/${room.id}`, "DELETE")}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function TypeRow({
  type,
  saving,
  onSave,
  onDelete
}: {
  type: SetupRoomType;
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [name, setName] = useState(type.name);
  const [rate, setRate] = useState(String(type.baseRate));
  const [gst, setGst] = useState(String(type.gstPercent));
  const [occupancy, setOccupancy] = useState(String(type.maxOccupancy));
  const [amenities, setAmenities] = useState((type.amenities ?? []).join(", "));

  return (
    <tr className="border-t border-border-subtle">
      <td className="py-2">
        <input
          className="h-8 w-36 rounded-lg border border-border-subtle bg-white px-2 text-sm font-medium"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <span className="mt-0.5 block text-xs text-text-muted">
          {formatCurrency(type.baseRate)} / night
        </span>
      </td>
      <td className="py-2">
        <input
          type="number"
          min={1}
          max={20}
          className="h-8 w-16 rounded-lg border border-border-subtle bg-white px-2 text-sm"
          value={occupancy}
          onChange={(event) => setOccupancy(event.target.value)}
        />
      </td>
      <td className="py-2">
        <input
          type="number"
          className="h-8 w-24 rounded-lg border border-border-subtle bg-white px-2 text-sm"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
        />
      </td>
      <td className="py-2">
        <input
          type="number"
          className="h-8 w-16 rounded-lg border border-border-subtle bg-white px-2 text-sm"
          value={gst}
          onChange={(event) => setGst(event.target.value)}
        />
      </td>
      <td className="py-2">
        <input
          className="h-8 w-56 rounded-lg border border-border-subtle bg-white px-2 text-sm"
          placeholder="AC, TV, Balcony"
          value={amenities}
          onChange={(event) => setAmenities(event.target.value)}
        />
        {type.amenities?.length ? (
          <span className="mt-0.5 block text-xs text-text-muted">{type.amenities.join(" · ")}</span>
        ) : null}
      </td>
      <td className="py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() =>
              void onSave({
                name: name.trim(),
                baseRate: Number(rate) || 0,
                gstPercent: Number(gst) || 0,
                maxOccupancy: Number(occupancy) || 1,
                amenities: amenities
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              })
            }
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" disabled={saving} onClick={() => void onDelete()}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

function RoomRow({
  room,
  types,
  saving,
  onSave,
  onDelete
}: {
  room: SetupRoom;
  types: SetupRoomType[];
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [number, setNumber] = useState(room.number);
  const [floor, setFloor] = useState(String(room.floor));
  const [roomTypeId, setRoomTypeId] = useState(room.roomTypeId);
  const [status, setStatus] = useState(room.status);
  const occupied = room.status === "occupied";
  const selectedType = types.find((type) => type.id === roomTypeId);

  return (
    <tr className="border-t border-border-subtle">
      <td className="py-2">
        <input
          className="h-8 w-24 rounded-lg border border-border-subtle bg-white px-2 text-sm font-medium"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
        />
      </td>
      <td className="py-2">
        <input
          type="number"
          min={0}
          className="h-8 w-16 rounded-lg border border-border-subtle bg-white px-2 text-sm"
          value={floor}
          onChange={(event) => setFloor(event.target.value)}
        />
      </td>
      <td className="py-2">
        <select
          className="h-8 rounded-lg border border-border-subtle bg-white px-2 text-sm"
          value={roomTypeId}
          onChange={(event) => setRoomTypeId(event.target.value)}
        >
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {selectedType ? (
          <span className="mt-0.5 block text-xs text-text-muted">
            {formatCurrency(selectedType.baseRate)} · {selectedType.maxOccupancy} guests
            {selectedType.amenities.length ? ` · ${selectedType.amenities.join(", ")}` : ""}
          </span>
        ) : null}
      </td>
      <td className="py-2">
        {occupied ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Occupied</span>
        ) : (
          <select
            className="h-8 rounded-lg border border-border-subtle bg-white px-2 text-sm capitalize"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() =>
              void onSave({
                number: number.trim(),
                floor: Number(floor) || 0,
                roomTypeId,
                ...(occupied ? {} : { status })
              })
            }
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" disabled={saving || occupied} onClick={() => void onDelete()}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
