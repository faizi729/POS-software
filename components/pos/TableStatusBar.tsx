"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "@/lib/toast";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

type TableItem = {
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

const pillStyles: Record<TableStatus, string> = {
  available: "bg-[rgba(21,128,61,0.12)] text-success",
  occupied: "bg-[rgba(180,35,24,0.12)] text-danger",
  reserved: "bg-[rgba(180,83,9,0.12)] text-warning",
  cleaning: "bg-bg-surface text-text-secondary"
};

export function TableStatusBar() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    number: "",
    label: "",
    capacity: "4",
    section: ""
  });

  async function loadTables() {
    try {
      const res = await fetch("/api/tables", { cache: "no-store" });
      const payload = (await res.json()) as { success: boolean; data?: TableItem[] };
      if (!res.ok || !payload.success) return;
      setTables(payload.data ?? []);
    } catch {
      // keep bar resilient
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      if (!active) return;
      await loadTables();
    }
    load();
    const id = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const counts = useMemo(() => {
    return {
      available: tables.filter((table) => table.status === "available").length,
      occupied: tables.filter((table) => table.status === "occupied").length,
      reserved: tables.filter((table) => table.status === "reserved").length,
      cleaning: tables.filter((table) => table.status === "cleaning").length
    };
  }, [tables]);

  async function releaseTable(tableId: string) {
    setIsPending(true);
    try {
      const res = await fetch(`/api/tables/${tableId}/release`, { method: "POST" });
      const payload = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Could not release table");
      }
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId ? { ...table, status: "cleaning", currentOrderId: null } : table
        )
      );
      setActivePopoverId(null);
      toast.success("Table moved to cleaning");
    } catch (error) {
      toast.error("Couldn’t release table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    } finally {
      setIsPending(false);
    }
  }

  async function createTable() {
    const number = createForm.number.trim();
    if (!number) {
      toast.error("Enter table number");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number,
          label: createForm.label.trim(),
          capacity: Number(createForm.capacity || 4),
          section: createForm.section.trim()
        })
      });
      const payload = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Couldn’t create table");
      }
      await loadTables();
      setShowCreate(false);
      setCreateForm({ number: "", label: "", capacity: "4", section: "" });
      toast.success("Table created");
    } catch (error) {
      toast.error("Couldn’t create table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    } finally {
      setCreating(false);
    }
  }

  async function markTableAvailable(tableId: string) {
    setIsPending(true);
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "available",
          currentOrderId: null
        })
      });
      const payload = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Couldn’t update table");
      }
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId ? { ...table, status: "available", currentOrderId: null } : table
        )
      );
      setActivePopoverId(null);
      toast.success("Table marked available");
    } catch (error) {
      toast.error("Couldn’t update table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    } finally {
      setIsPending(false);
    }
  }

  async function markTableReserved(tableId: string) {
    setIsPending(true);
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "reserved",
          currentOrderId: null
        })
      });
      const payload = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Couldn’t reserve table");
      }
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId ? { ...table, status: "reserved", currentOrderId: null } : table
        )
      );
      setActivePopoverId(null);
      toast.success("Table reserved");
    } catch (error) {
      toast.error("Couldn’t reserve table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text-primary">Tables</p>
        <Button variant="secondary" className="h-9 rounded-xl cursor-pointer" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" />
          {showCreate ? "Close" : "Create Table"}
        </Button>
      </div>

      {showCreate ? (
        <div className="mb-3 grid gap-2 rounded-2xl border border-border-subtle bg-bg-surface p-3 md:grid-cols-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-secondary">Number</p>
            <Input
              placeholder="e.g. A1"
              value={createForm.number}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, number: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-secondary">Label</p>
            <Input
              placeholder="e.g. Window"
              value={createForm.label}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, label: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-secondary">Capacity</p>
            <Input
              type="number"
              min={1}
              placeholder="4"
              value={createForm.capacity}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, capacity: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-secondary">Section</p>
            <Input
              placeholder="e.g. Ground Floor"
              value={createForm.section}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, section: e.target.value }))}
            />
          </div>
          <Button
            className="h-10 rounded-xl bg-accent-primary hover:bg-accent-primary-hover cursor-pointer"
            disabled={creating}
            onClick={() => void createTable()}
          >
            {creating ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tables.map((table) => (
          <div key={table.id} className="relative">
            <button
              type="button"
              onClick={() => {
                setActivePopoverId((prev) => (prev === table.id ? null : table.id));
              }}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition",
                pillStyles[table.status],
                "hover:opacity-85"
              )}
            >
              Table {table.number}
            </button>
          </div>
        ))}
      </div>

      {activePopoverId ? (
        (() => {
          const activeTable = tables.find((table) => table.id === activePopoverId);
          if (!activeTable) return null;
          return (
            <div className="mt-3 rounded-2xl border border-border-subtle bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Table {activeTable.number}</p>
                  {activeTable.label ? (
                    <p className="text-xs text-text-secondary">Label: {activeTable.label}</p>
                  ) : null}
                  {activeTable.currentOrderId ? (
                    <>
                      <p className="text-xs text-text-secondary">{activeTable.currentOrderId.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        Token #{activeTable.currentOrderId.tokenNumber || "-"}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        Total {formatCurrency(activeTable.currentOrderId.pricing?.grandTotal ?? 0)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-text-secondary capitalize">Status: {activeTable.status}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 rounded-lg cursor-pointer"
                    onClick={() => setActivePopoverId(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="h-8 rounded-lg cursor-pointer"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => {
                      if (activeTable.status === "occupied") {
                        void releaseTable(activeTable.id);
                        return;
                      }
                      if (activeTable.status === "available") {
                        void markTableReserved(activeTable.id);
                        return;
                      }
                      void markTableAvailable(activeTable.id);
                    }}
                  >
                    {activeTable.status === "occupied"
                      ? "Release Table"
                      : activeTable.status === "available"
                        ? "Reserve Table"
                        : "Mark Available"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
