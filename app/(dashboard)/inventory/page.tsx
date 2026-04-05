"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Search,
  ArrowUpDown,
  PackagePlus,
  Trash2,
  History,
  X,
  Check,
  ChevronDown,
  BookOpen,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ──────── Types ──────── */

type IngredientItem = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  costPerUnit: number;
  supplier: string;
  isLow: boolean;
  isOut: boolean;
};

type InventoryLogItem = {
  id: string;
  ingredientName: string;
  ingredientUnit: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
};

type RecipeItem = {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantityRequired: number;
    unit: string;
  }>;
};

type AlertItem = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  deficit: number;
};

/* ──────── Tab definitions ──────── */

const TABS = [
  { key: "ingredients", label: "Ingredients", icon: Package },
  { key: "recipes", label: "Recipes", icon: BookOpen },
  { key: "alerts", label: "Alerts", icon: ShieldAlert },
  { key: "logs", label: "Activity Log", icon: History }
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ──────── Main Page ──────── */

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ingredients");
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [logs, setLogs] = useState<InventoryLogItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add ingredient form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    unit: "kg",
    currentStock: 0,
    reorderLevel: 0,
    costPerUnit: 0,
    supplier: ""
  });

  // Restock modal
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [restockAction, setRestockAction] = useState<"restock" | "wastage">("restock");

  const fetchIngredients = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/ingredients");
      const json = await res.json();
      if (json.success) setIngredients(json.data);
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/logs");
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch {}
  }, []);

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/recipes");
      const json = await res.json();
      if (json.success) setRecipes(json.data);
    } catch {}
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/alerts");
      const json = await res.json();
      if (json.success) setAlerts(json.data.alerts);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchIngredients(), fetchLogs(), fetchRecipes(), fetchAlerts()]).finally(() =>
      setLoading(false)
    );
  }, [fetchIngredients, fetchLogs, fetchRecipes, fetchAlerts]);

  const handleAddIngredient = async () => {
    if (!addForm.name.trim()) return;
    try {
      const res = await fetch("/api/inventory/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setShowAddForm(false);
        setAddForm({ name: "", unit: "kg", currentStock: 0, reorderLevel: 0, costPerUnit: 0, supplier: "" });
        await fetchIngredients();
        await fetchAlerts();
      }
    } catch {}
  };

  const handleStockAdjust = async () => {
    if (!restockId || restockQty <= 0) return;
    try {
      await fetch(`/api/inventory/ingredients/${restockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: restockAction, quantity: restockQty })
      });
      setRestockId(null);
      setRestockQty(0);
      await Promise.all([fetchIngredients(), fetchLogs(), fetchAlerts()]);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/inventory/ingredients/${id}`, { method: "DELETE" });
      await Promise.all([fetchIngredients(), fetchAlerts()]);
    } catch {}
  };

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const alertCount = ingredients.filter((i) => i.isLow || i.isOut).length;

  return (
    <>
      {/* Header */}
      <div className="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Inventory & Recipes</h2>
            <p className="text-sm text-text-muted">
              {ingredients.length} ingredients · {recipes.length} recipes mapped
              {alertCount > 0 && (
                <span className="ml-2 text-amber-500">· {alertCount} alerts</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              Promise.all([fetchIngredients(), fetchLogs(), fetchRecipes(), fetchAlerts()]).finally(() =>
                setLoading(false)
              );
            }}
            className="flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary-hover"
          >
            <Plus className="h-4 w-4" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Package className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{ingredients.length}</p>
              <p className="text-xs text-text-muted">Total Ingredients</p>
            </div>
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{recipes.length}</p>
              <p className="text-xs text-text-muted">Recipe Mappings</p>
            </div>
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {ingredients.filter((i) => i.isLow && !i.isOut).length}
              </p>
              <p className="text-xs text-text-muted">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {ingredients.filter((i) => i.isOut).length}
              </p>
              <p className="text-xs text-text-muted">Out of Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="surface-card overflow-hidden">
        <div className="flex border-b border-border-subtle">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-b-2 border-accent-primary text-accent-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.key === "alerts" && alertCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ── Ingredients Tab ── */}
          {activeTab === "ingredients" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
                />
              </div>

              {filteredIngredients.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted">
                  {ingredients.length === 0
                    ? "No ingredients added yet. Click 'Add Ingredient' to start."
                    : "No matching ingredients found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-left text-xs text-text-muted">
                        <th className="pb-3 pl-3 font-medium">Ingredient</th>
                        <th className="pb-3 font-medium">Stock</th>
                        <th className="pb-3 font-medium">Reorder At</th>
                        <th className="pb-3 font-medium">Cost/Unit</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 pr-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ing) => (
                        <tr
                          key={ing.id}
                          className="border-b border-border-subtle last:border-0 transition-colors hover:bg-bg-surface"
                        >
                          <td className="py-3 pl-3">
                            <p className="font-medium text-text-primary">{ing.name}</p>
                            {ing.supplier && (
                              <p className="text-xs text-text-muted">{ing.supplier}</p>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="font-mono text-text-primary">
                              {ing.currentStock} {ing.unit}
                            </span>
                          </td>
                          <td className="py-3 text-text-muted">
                            {ing.reorderLevel} {ing.unit}
                          </td>
                          <td className="py-3 text-text-muted">
                            ₹{ing.costPerUnit.toFixed(2)}
                          </td>
                          <td className="py-3">
                            {ing.isOut ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
                                <TrendingDown className="h-3 w-3" /> Out
                              </span>
                            ) : ing.isLow ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500">
                                <AlertTriangle className="h-3 w-3" /> Low
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                                <Check className="h-3 w-3" /> OK
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setRestockId(ing.id);
                                  setRestockAction("restock");
                                  setRestockQty(0);
                                }}
                                className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-500/10"
                                title="Restock"
                              >
                                <PackagePlus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(ing.id)}
                                className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Recipes Tab ── */}
          {activeTab === "recipes" && (
            <div className="space-y-4">
              {recipes.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted">
                  No recipe mappings yet. Map menu items to ingredients to enable auto-deduction.
                </div>
              ) : (
                <div className="space-y-3">
                  {recipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="rounded-xl border border-border-subtle p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-text-primary">{recipe.menuItemName}</p>
                          <p className="text-xs text-text-muted">₹{recipe.menuItemPrice}</p>
                        </div>
                        <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs font-medium text-text-muted">
                          {recipe.ingredients.length} ingredients
                        </span>
                      </div>
                      <div className="space-y-1">
                        {recipe.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-bg-surface px-3 py-2 text-sm"
                          >
                            <span className="text-text-secondary">{ing.ingredientName}</span>
                            <span className="font-mono text-text-muted">
                              {ing.quantityRequired} {ing.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Alerts Tab ── */}
          {activeTab === "alerts" && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted">
                  All stock levels are healthy. No alerts! 🎉
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4",
                      alert.currentStock <= 0
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-amber-500/20 bg-amber-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {alert.currentStock <= 0 ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <p className="font-semibold text-text-primary">{alert.name}</p>
                        <p className="text-xs text-text-muted">
                          Stock: {alert.currentStock} {alert.unit} · Reorder at: {alert.reorderLevel}{" "}
                          {alert.unit}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setRestockId(alert.id);
                        setRestockAction("restock");
                        setRestockQty(0);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Logs Tab ── */}
          {activeTab === "logs" && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted">
                  No activity logs yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-border-subtle p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          log.type === "restock"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : log.type === "deduction"
                            ? "bg-blue-500/10 text-blue-500"
                            : log.type === "wastage"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-zinc-500/10 text-zinc-500"
                        )}
                      >
                        {log.type === "restock" ? (
                          <PackagePlus className="h-4 w-4" />
                        ) : log.type === "deduction" ? (
                          <ArrowUpDown className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {log.ingredientName}
                          <span className="ml-2 font-mono text-xs text-text-muted">
                            {log.previousStock} → {log.newStock} {log.ingredientUnit}
                          </span>
                        </p>
                        <p className="text-xs text-text-muted">{log.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-sm font-mono font-semibold",
                          log.quantity > 0 ? "text-emerald-500" : "text-red-400"
                        )}
                      >
                        {log.quantity > 0 ? "+" : ""}
                        {log.quantity}
                      </span>
                      {log.createdAt && (
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Ingredient Modal ── */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowAddForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-bg-elevated p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">Add Ingredient</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-text mb-1 block">Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  placeholder="e.g., Onions"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text mb-1 block">Unit *</label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    {["kg", "g", "L", "ml", "pcs", "dozen", "bunch", "packet"].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text mb-1 block">Current Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={addForm.currentStock}
                    onChange={(e) =>
                      setAddForm({ ...addForm, currentStock: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text mb-1 block">Reorder Level</label>
                  <input
                    type="number"
                    min={0}
                    value={addForm.reorderLevel}
                    onChange={(e) =>
                      setAddForm({ ...addForm, reorderLevel: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label-text mb-1 block">Cost/Unit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={addForm.costPerUnit}
                    onChange={(e) =>
                      setAddForm({ ...addForm, costPerUnit: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="label-text mb-1 block">Supplier</label>
                <input
                  type="text"
                  value={addForm.supplier}
                  onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  placeholder="Optional"
                />
              </div>
              <button
                onClick={handleAddIngredient}
                disabled={!addForm.name.trim()}
                className="w-full rounded-xl bg-accent-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Restock Modal ── */}
      {restockId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setRestockId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-bg-elevated p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">
                {restockAction === "restock" ? "Restock" : "Record Wastage"}
              </h3>
              <button onClick={() => setRestockId(null)}>
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <p className="text-sm text-text-muted mb-4">
              {ingredients.find((i) => i.id === restockId)?.name ?? "Ingredient"}
            </p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setRestockAction("restock")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  restockAction === "restock"
                    ? "bg-emerald-500 text-white"
                    : "border border-border-subtle text-text-secondary"
                )}
              >
                Restock
              </button>
              <button
                onClick={() => setRestockAction("wastage")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  restockAction === "wastage"
                    ? "bg-red-500 text-white"
                    : "border border-border-subtle text-text-secondary"
                )}
              >
                Wastage
              </button>
            </div>
            <div className="mb-4">
              <label className="label-text mb-1 block">Quantity</label>
              <input
                type="number"
                min={0}
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
              />
            </div>
            <button
              onClick={handleStockAdjust}
              disabled={restockQty <= 0}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50",
                restockAction === "restock"
                  ? "bg-emerald-500 hover:bg-emerald-400"
                  : "bg-red-500 hover:bg-red-400"
              )}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </>
  );
}
