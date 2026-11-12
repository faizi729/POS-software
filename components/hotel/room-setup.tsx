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
};

export type SetupRoom = {
  id: string;
  number: string;
  floor: number;
  status: string;
  roomTypeId: string;
  roomTypeName: string;
};

export function RoomSetup({ types, rooms }: { types: SetupRoomType[]; rooms: SetupRoom[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeName, setTypeName] = useState("");
  const [typeRate, setTypeRate] = useState("");
  const [typeGst, setTypeGst] = useState("12");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomFloor, setRoomFloor] = useState("1");
  const [roomTypeId, setRoomTypeId] = useState(types[0]?.id ?? "");

  async function send(url: string, method: string, body?: unknown) {
    setSaving(true);
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data?.error || "Request failed");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Rooms setup</h1>
        <Button variant="secondary" size="sm" onClick={() => router.push("/rooms")}>
          Calendar
        </Button>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <section className="surface-card overflow-x-auto p-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Type</span>
            <input
              className="mt-1 h-9 w-40 rounded-xl border border-border-subtle bg-white px-3 text-sm"
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
          <Button
            size="sm"
            disabled={saving || !typeName.trim()}
            onClick={async () => {
              const done = await send("/api/hotel/room-types", "POST", {
                name: typeName.trim(),
                baseRate: Number(typeRate) || 0,
                gstPercent: Number(typeGst) || 0
              });
              if (done) setTypeName("");
            }}
          >
            Add type
          </Button>
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody>
            {types.map((type) => (
              <tr key={type.id} className="border-t border-border-subtle">
                <td className="py-2 text-text-primary">{type.name}</td>
                <td className="py-2 text-text-secondary">{formatCurrency(type.baseRate)}</td>
                <td className="py-2 text-text-muted">{type.gstPercent}% GST</td>
                <td className="py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => void send(`/api/hotel/room-types/${type.id}`, "DELETE")}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="surface-card overflow-x-auto p-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Room</span>
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
            <span className="font-medium text-text-secondary">Type</span>
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
            disabled={saving || !roomNumber.trim() || !roomTypeId}
            onClick={async () => {
              const done = await send("/api/hotel/rooms", "POST", {
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

        <table className="mt-4 w-full text-sm">
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-t border-border-subtle">
                <td className="py-2 font-medium text-text-primary">{room.number}</td>
                <td className="py-2 text-text-secondary">{room.roomTypeName}</td>
                <td className="py-2 text-text-muted">
                  Floor {room.floor} - {room.status}
                </td>
                <td className="py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => void send(`/api/hotel/rooms/${room.id}`, "DELETE")}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
