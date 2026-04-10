"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/toast";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export type PosTable = {
  id: string;
  number: string;
  label: string;
  capacity: number;
  status: TableStatus;
  section: string;
  currentOrderId: {
    id: string;
    orderNumber: string;
    tokenNumber: number;
    status: string;
    paymentStatus: string;
    pricing: { grandTotal: number };
  } | null;
};

const statusStyles: Record<TableStatus, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  occupied: "bg-red-100 text-red-700 border-red-200",
  reserved: "bg-amber-100 text-amber-700 border-amber-200",
  cleaning: "bg-zinc-100 text-zinc-500 border-zinc-200"
};

export function TablePickerModal({
  open,
  onClose,
  onSelect,
  currentTableNo
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (table: PosTable) => void;
  currentTableNo?: string;
}) {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    number: "",
    label: "",
    capacity: "4",
    section: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function load() {
      if (!active) return;
      setLoading(true);
      try {
        const res = await fetch("/api/tables", { cache: "no-store" });
        const payload = (await res.json()) as { success: boolean; data?: PosTable[]; error?: string };
        if (!res.ok || !payload.success) {
          throw new Error(payload.error ?? "Failed to load tables");
        }
        if (active) setTables(payload.data ?? []);
      } catch (error: unknown) {
        toast.error("Couldn’t load tables", {
          message: error instanceof Error ? error.message : "Try again"
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [open]);

  const grouped = useMemo(() => {
    const map = new Map<string, PosTable[]>();
    for (const table of tables) {
      const key = table.section?.trim() || "General";
      map.set(key, [...(map.get(key) ?? []), table]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tables]);

  async function createTable() {
    const number = createForm.number.trim();
    if (!number) {
      toast.error("Table number is required");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number,
          label: createForm.label,
          capacity: Number(createForm.capacity || 4),
          section: createForm.section
        })
      });
      const payload = (await res.json()) as { success: boolean; data?: PosTable; error?: string };
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Couldn’t create table");
      }
      setTables((prev) =>
        [...prev, payload.data!].sort((a, b) => a.number.localeCompare(b.number))
      );
      setCreateForm({ number: "", label: "", capacity: "4", section: "" });
      setShowCreate(false);
      toast.success("Table created");
    } catch (error) {
      toast.error("Couldn’t create table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Select table" description="Assign this dine-in order to a table.">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="label-text">Need a new table?</p>
            <Button variant="secondary" className="cursor-pointer" onClick={() => setShowCreate((value) => !value)}>
              {showCreate ? "Cancel" : "Create table"}
            </Button>
          </div>
          {showCreate ? (
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <Input
                placeholder="Number"
                value={createForm.number}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, number: e.target.value }))}
              />
              <Input
                placeholder="Label"
                value={createForm.label}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, label: e.target.value }))}
              />
              <Input
                type="number"
                min={1}
                placeholder="Capacity"
                value={createForm.capacity}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, capacity: e.target.value }))}
              />
              <Input
                placeholder="Section"
                value={createForm.section}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, section: e.target.value }))}
              />
              <div className="md:col-span-4 flex justify-end">
                <Button
                  className="bg-accent-primary hover:bg-accent-primary-hover cursor-pointer"
                  disabled={isCreating}
                  onClick={() => void createTable()}
                >
                  {isCreating ? "Creating..." : "Save table"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {loading ? <p className="text-sm text-text-secondary">Loading tables...</p> : null}

        {grouped.map(([section, sectionTables]) => (
          <div key={section} className="space-y-2">
            <p className="label-text">{section}</p>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {sectionTables.map((table) => {
                const disabled = table.status === "occupied" || table.status === "cleaning";
                const selected = currentTableNo === table.number;
                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(table)}
                    className={cn(
                      "rounded-2xl border bg-white p-3 text-left transition",
                      statusStyles[table.status],
                      selected ? "ring-2 ring-accent-primary" : "",
                      disabled ? "cursor-not-allowed opacity-60" : "hover:border-border-strong"
                    )}
                  >
                    <p className="text-lg font-bold">Table {table.number}</p>
                    {table.label ? <p className="text-xs">{table.label}</p> : null}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users className="h-3.5 w-3.5" /> {table.capacity}
                      </span>
                      <Badge className="capitalize" variant="neutral">
                        {table.status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3">
          <p className="label-text mb-2">Legend</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {(["available", "occupied", "reserved", "cleaning"] as const).map((status) => (
              <span key={status} className={cn("rounded-full border px-2.5 py-1 capitalize", statusStyles[status])}>
                {status}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" className="cursor-pointer" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
