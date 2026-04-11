"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/toast";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

type TableRow = {
  id: string;
  number: string;
  label: string;
  capacity: number;
  status: TableStatus;
  section: string;
};

export function TableManager({ initialTables }: { initialTables: TableRow[] }) {
  const [tables, setTables] = useState<TableRow[]>(initialTables);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ number: "", label: "", capacity: "4", section: "" });

  async function createTable() {
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: form.number,
          label: form.label,
          capacity: Number(form.capacity || 4),
          section: form.section
        })
      });
      const payload = (await res.json()) as { success: boolean; data?: TableRow; error?: string };
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Couldn’t add table");
      }
      const newRow = payload.data;
      setTables((prev) => [...prev, newRow].sort((a, b) => a.number.localeCompare(b.number)));
      setForm({ number: "", label: "", capacity: "4", section: "" });
      setOpen(false);
      toast.success("Table added");
    } catch (error) {
      toast.error("Couldn’t add table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  async function patchTable(id: string, patch: Partial<TableRow>) {
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const payload = (await res.json()) as { success: boolean; data?: TableRow; error?: string };
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Couldn’t update table");
      }
      setTables((prev) => prev.map((row) => (row.id === id ? { ...row, ...payload.data } : row)));
      toast.success("Table updated");
    } catch (error) {
      toast.error("Couldn’t update table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  async function deleteTable(id: string) {
    if (!confirm("Delete this table?")) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      const payload = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Couldn’t delete table");
      }
      setTables((prev) => prev.filter((table) => table.id !== id));
      toast.info("Table deleted");
    } catch (error) {
      toast.error("Couldn’t delete table", {
        message: error instanceof Error ? error.message : "Try again"
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border-subtle bg-bg-elevated">
        <CardHeader className="border-b border-border-subtle bg-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label-text">Settings</p>
              <CardTitle className="mt-2">Tables</CardTitle>
            </div>
            <Button className="bg-accent-primary hover:bg-accent-primary-hover" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Table
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {tables.length === 0 ? <p className="text-sm text-text-secondary">No tables added yet.</p> : null}
            {tables.map((table) => (
              <div key={table.id} className="rounded-2xl border border-border-subtle bg-white p-3">
                <div className="grid gap-2 md:grid-cols-[0.8fr_1fr_0.8fr_1fr_0.9fr_auto] md:items-center">
                  <Input
                    value={table.number}
                    onChange={(e) =>
                      setTables((prev) =>
                        prev.map((row) => (row.id === table.id ? { ...row, number: e.target.value } : row))
                      )
                    }
                    onBlur={() => void patchTable(table.id, { number: table.number })}
                  />
                  <Input
                    value={table.label}
                    onChange={(e) =>
                      setTables((prev) =>
                        prev.map((row) => (row.id === table.id ? { ...row, label: e.target.value } : row))
                      )
                    }
                    onBlur={() => void patchTable(table.id, { label: table.label })}
                    placeholder="Label"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={table.capacity}
                    onChange={(e) =>
                      setTables((prev) =>
                        prev.map((row) =>
                          row.id === table.id ? { ...row, capacity: Number(e.target.value || 1) } : row
                        )
                      )
                    }
                    onBlur={() => void patchTable(table.id, { capacity: table.capacity })}
                  />
                  <Input
                    value={table.section}
                    onChange={(e) =>
                      setTables((prev) =>
                        prev.map((row) => (row.id === table.id ? { ...row, section: e.target.value } : row))
                      )
                    }
                    onBlur={() => void patchTable(table.id, { section: table.section })}
                    placeholder="Section"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      className="h-11 w-full rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                      value={table.status}
                      onChange={(e) =>
                        setTables((prev) =>
                          prev.map((row) =>
                            row.id === table.id
                              ? { ...row, status: e.target.value as TableStatus }
                              : row
                          )
                        )
                      }
                      onBlur={() => void patchTable(table.id, { status: table.status })}
                    >
                      <option value="available">available</option>
                      <option value="occupied">occupied</option>
                      <option value="reserved">reserved</option>
                      <option value="cleaning">cleaning</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant="neutral" className={cn("capitalize")}>
                      {table.status}
                    </Badge>
                    <Button
                      variant="secondary"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      onClick={() => void deleteTable(table.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add table"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-accent-primary hover:bg-accent-primary-hover" onClick={() => void createTable()}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input
            placeholder="Number (e.g. 04)"
            value={form.number}
            onChange={(e) => setForm((prev) => ({ ...prev, number: e.target.value }))}
          />
          <Input
            placeholder="Label (optional)"
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
          />
          <Input
            type="number"
            min={1}
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
          />
          <Input
            placeholder="Section (e.g. Ground Floor)"
            value={form.section}
            onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
