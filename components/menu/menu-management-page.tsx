"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";

type MenuCategory = {
  id: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
};

type MenuItem = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  isAvailable: boolean;
  isActive?: boolean;
};

type BuilderVariant = {
  id: string;
  groupName: string;
  optionName: string;
  variantType: string;
};

type BuilderAddon = {
  id: string;
  name: string;
  price: number;
};

type BuilderAddonGroup = {
  id: string;
  name: string;
  selectionType: string;
  addons: BuilderAddon[];
};

type BuilderItem = {
  id: string;
  name: string;
  dietary: string;
  pricingMode: string;
  dayParts: string[];
  channels: string[];
  outletIds: string[];
  prepTimeMinutes: number;
  metadata: {
    bestSellerScore: number;
    lowPerformerScore: number;
    suggestedComboScore: number;
  };
  variants: BuilderVariant[];
  addonGroups: BuilderAddonGroup[];
  combos: Array<{ id: string; name: string; comboType: string }>;
  inventoryMappings: Array<{ id: string; ingredientName: string; quantityRequired: number; stockUnit: string }>;
};

type BuilderSubcategory = {
  id: string;
  name: string;
  channels: string[];
  dayParts: string[];
  items: BuilderItem[];
};

type BuilderCategory = {
  id: string;
  name: string;
  channels: string[];
  dayParts: string[];
  items: BuilderItem[];
  subcategories: BuilderSubcategory[];
};

type BuilderMenu = {
  id: string;
  name: string;
  description: string;
  channels: string[];
  serviceModes: string[];
  dayParts: string[];
  outletIds?: string[];
  categories: BuilderCategory[];
};

type BuilderWorkspace = {
  summary: {
    menuCount: number;
    categoryCount: number;
    subcategoryCount: number;
    itemCount: number;
    variantCount: number;
    addonGroupCount: number;
    comboCount: number;
    inventoryLinkedCount: number;
  };
  tree: BuilderMenu[];
};

export function MenuManagementPage({
  categories,
  items,
  builder
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  builder: BuilderWorkspace;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [menuId, setMenuId] = useState(builder.tree[0]?.id ?? "");
  const [builderCategoryId, setBuilderCategoryId] = useState(builder.tree[0]?.categories[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [catalogCategoryId, setCatalogCategoryId] = useState("all");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        catalogCategoryId === "all" || item.categoryId === catalogCategoryId;

      return matchesQuery && matchesCategory;
    });
  }, [catalogCategoryId, items, query]);

  const selectedMenu = useMemo(
    () => builder.tree.find((entry) => entry.id === menuId) ?? builder.tree[0],
    [builder.tree, menuId]
  );

  const builderCategories = selectedMenu?.categories ?? [];

  const selectedBuilderCategory = useMemo(
    () =>
      builderCategories.find((entry) => entry.id === builderCategoryId) ?? builderCategories[0],
    [builderCategories, builderCategoryId]
  );

  const subcategories = selectedBuilderCategory?.subcategories ?? [];

  const selectedSubcategory = useMemo(
    () =>
      subcategories.find((entry) => entry.id === subcategoryId) ??
      (subcategoryId ? undefined : undefined),
    [subcategories, subcategoryId]
  );

  async function toggleAvailability(id: string) {
    await fetch(`/api/menu/items/${id}/toggle-availability`, { method: "POST" });
    startTransition(() => router.refresh());
  }

  async function saveItem() {
    if (!name || !price) {
      return;
    }

    let request: Promise<Response>;

    if (editingItemId) {
      const payload = {
        categoryId,
        name,
        price: Number(price),
        taxRate: 8,
        isAvailable: true,
        isActive: true,
        tags: [],
        sortOrder: items.length + 1
      };

      request = fetch(`/api/menu/items/${editingItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      const effectiveCategory = selectedBuilderCategory;

      if (!selectedMenu || !effectiveCategory) {
        return;
      }

      const inheritedChannels = selectedSubcategory?.channels?.length
        ? selectedSubcategory.channels
        : effectiveCategory.channels?.length
          ? effectiveCategory.channels
          : selectedMenu.channels ?? ["pos"];
      const inheritedDayParts = selectedSubcategory?.dayParts?.length
        ? selectedSubcategory.dayParts
        : effectiveCategory.dayParts?.length
          ? effectiveCategory.dayParts
          : selectedMenu.dayParts ?? ["all_day"];
      const inheritedOutletIds = selectedMenu.outletIds?.length ? selectedMenu.outletIds : [];

      request = fetch("/api/menu/builder/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: selectedMenu.id,
          categoryId: effectiveCategory.id,
          subcategoryId: selectedSubcategory?.id || undefined,
          name,
          price: Number(price),
          taxRate: 8,
          itemType: "standard",
          dietary: "none",
          pricingMode: "base",
          prepTimeMinutes: 10,
          isAvailable: true,
          isActive: true,
          autoDisableOnOutOfStock: false,
          dayParts: inheritedDayParts,
          channels: inheritedChannels,
          outletIds: inheritedOutletIds,
          tags: [],
          metadata: {
            bestSellerScore: 0,
            lowPerformerScore: 0,
            suggestedComboScore: 0
          },
          sortOrder: items.length + 1,
          variants: [],
          addonGroups: [],
          inventoryMappings: []
        })
      });
    }

    await request;
    resetItemForm();
    startTransition(() => router.refresh());
  }

  async function removeItem(id: string) {
    await fetch(`/api/menu/items/${id}`, { method: "DELETE" });
    if (editingItemId === id) {
      resetItemForm();
    }
    startTransition(() => router.refresh());
  }

  async function saveCategory() {
    if (!categoryName.trim()) {
      return;
    }

    const request = editingCategoryId
      ? fetch(`/api/menu/categories/${editingCategoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName,
            sortOrder:
              categories.find((category) => category.id === editingCategoryId)?.sortOrder ?? 0,
            isActive: true
          })
        })
      : fetch("/api/menu/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName,
            sortOrder: categories.length + 1,
            isActive: true
          })
        });

    await request;
    setCategoryName("");
    setEditingCategoryId(null);
    startTransition(() => router.refresh());
  }

  async function removeCategory(id: string) {
    await fetch(`/api/menu/categories/${id}`, { method: "DELETE" });
    if (editingCategoryId === id) {
      setEditingCategoryId(null);
      setCategoryName("");
    }
    startTransition(() => router.refresh());
  }

  function startEditCategory(category: MenuCategory) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
  }

  function startEditItem(item: MenuItem) {
    setEditingItemId(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setCategoryId(item.categoryId);
  }

  function resetItemForm() {
    setEditingItemId(null);
    setName("");
    setPrice("");
    setCategoryId(categories[0]?.id ?? "");
    setMenuId(builder.tree[0]?.id ?? "");
    setBuilderCategoryId(builder.tree[0]?.categories[0]?.id ?? "");
    setSubcategoryId("");
  }

  function formatLabel(value: string) {
    return value.replaceAll("_", " ");
  }

  function getHealthBadge(item: BuilderItem) {
    if (item.metadata.bestSellerScore >= 80) {
      return { label: "Best seller", variant: "success" as const };
    }

    if (item.metadata.lowPerformerScore >= 50) {
      return { label: "Needs attention", variant: "warning" as const };
    }

    return { label: "Stable", variant: "neutral" as const };
  }

  function handleMenuChange(nextMenuId: string) {
    setMenuId(nextMenuId);
    const nextMenu = builder.tree.find((entry) => entry.id === nextMenuId);
    const nextCategory = nextMenu?.categories[0];
    setBuilderCategoryId(nextCategory?.id ?? "");
    setSubcategoryId("");
  }

  function handleBuilderCategoryChange(nextCategoryId: string) {
    setBuilderCategoryId(nextCategoryId);
    setSubcategoryId("");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <p className="label-text">Menu operating engine</p>
            <CardTitle className="mt-2">
              Build flexible menus across POS, QR, website, and future marketplace channels
            </CardTitle>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
              This workspace now supports dynamic menu hierarchy, variant pricing, add-ons,
              combos, outlet control, daypart rules, and inventory linkage without forcing every
              restaurant into the same catalog shape.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
              <p className="label-text">Menus</p>
              <h3 className="mt-2">{builder.summary.menuCount}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
              <p className="label-text">Categories</p>
              <h3 className="mt-2">{builder.summary.categoryCount}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
              <p className="label-text">Subcategories</p>
              <h3 className="mt-2">{builder.summary.subcategoryCount}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
              <p className="label-text">Variants</p>
              <h3 className="mt-2">{builder.summary.variantCount}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
              <p className="label-text">Modifier groups</p>
              <h3 className="mt-2">{builder.summary.addonGroupCount}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
              <p className="label-text">Inventory linked</p>
              <h3 className="mt-2">{builder.summary.inventoryLinkedCount}</h3>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[20px] border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label-text">Dynamic hierarchy</p>
                  <h3 className="mt-2 text-lg font-semibold text-text-primary">
                    Menu {"->"} Category {"->"} Subcategory {"->"} Item {"->"} Variant {"->"} Add-on
                  </h3>
                </div>
                <Badge variant="neutral">Future-ready</Badge>
              </div>
              <div className="mt-4 space-y-4">
                {builder.tree.map((menu) => (
                  <div key={menu.id} className="rounded-2xl border border-border-subtle bg-white p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-text-primary">{menu.name}</p>
                        <p className="text-sm text-text-secondary">{menu.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {menu.channels.map((channel) => (
                          <Badge key={channel} variant="neutral">
                            {channel.toUpperCase()}
                          </Badge>
                        ))}
                        {menu.serviceModes.map((mode) => (
                          <Badge key={mode} variant="neutral">
                            {formatLabel(mode)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {menu.categories.map((category) => (
                        <div
                          key={category.id}
                          className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold text-text-primary">{category.name}</p>
                              <p className="text-sm text-text-secondary">
                                {category.subcategories.length} subcategories •{" "}
                                {category.items.length +
                                  category.subcategories.reduce(
                                    (sum, subcategory) => sum + subcategory.items.length,
                                    0
                                  )}{" "}
                                items
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {category.dayParts.map((dayPart) => (
                                <Badge key={dayPart} variant="neutral">
                                  {formatLabel(dayPart)}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {category.subcategories.length ? (
                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                              {category.subcategories.map((subcategory) => (
                                <div
                                  key={subcategory.id}
                                  className="rounded-2xl border border-border-subtle bg-white p-4"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <p className="font-semibold text-text-primary">
                                        {subcategory.name}
                                      </p>
                                      <p className="text-sm text-text-secondary">
                                        {subcategory.items.length} items
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {subcategory.channels.map((channel) => (
                                        <Badge key={channel} variant="neutral">
                                          {channel.toUpperCase()}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-3">
                                    {subcategory.items.map((item) => {
                                      const health = getHealthBadge(item);

                                      return (
                                        <div
                                          key={item.id}
                                          className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-3"
                                        >
                                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div>
                                              <p className="font-semibold text-text-primary">
                                                {item.name}
                                              </p>
                                              <p className="text-sm text-text-secondary">
                                                {item.variants.length} variants •{" "}
                                                {item.addonGroups.length} modifier groups •{" "}
                                                {item.inventoryMappings.length} inventory links
                                              </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              <Badge variant={health.variant}>{health.label}</Badge>
                                              <Badge variant="neutral">
                                                {formatLabel(item.dietary)}
                                              </Badge>
                                              <Badge variant="neutral">
                                                {item.pricingMode === "variant"
                                                  ? "Variant pricing"
                                                  : "Base pricing"}
                                              </Badge>
                                            </div>
                                          </div>

                                          <div className="mt-3 flex flex-wrap gap-2">
                                            {item.variants.slice(0, 3).map((variant) => (
                                              <Badge key={variant.id} variant="neutral">
                                                {variant.groupName}: {variant.optionName}
                                              </Badge>
                                            ))}
                                            {item.addonGroups.slice(0, 2).map((group) => (
                                              <Badge key={group.id} variant="neutral">
                                                {group.name} ({group.selectionType})
                                              </Badge>
                                            ))}
                                            {item.combos.slice(0, 1).map((combo) => (
                                              <Badge key={combo.id} variant="success">
                                                Combo: {combo.name}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              {category.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-xl border border-border-subtle bg-white px-3 py-3"
                                >
                                  <p className="font-semibold text-text-primary">{item.name}</p>
                                  <p className="text-sm text-text-secondary">
                                    {item.channels.join(", ")} • {item.dayParts.join(", ")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[20px] border border-border-subtle bg-bg-surface p-4">
                <p className="label-text">Engine capabilities</p>
                <div className="mt-4 grid gap-3">
                  {[
                    "Variant-based pricing for size, half/full, and custom option sets",
                    "Single-select and multi-select modifier groups with required logic",
                    "Combo meals with fixed or customizable slots and upsell hooks",
                    "Outlet, daypart, and channel visibility per menu node and item",
                    "Inventory deduction mapping for raw materials and low-stock signals",
                    "AI-ready scoring for best sellers, low performers, and combo suggestions"
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm text-text-primary"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-border-subtle bg-bg-surface p-4">
                <p className="label-text">Builder health</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-border-subtle bg-white px-4 py-3">
                    <p className="font-semibold text-text-primary">
                      {builder.summary.itemCount} builder-ready items
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Every item can now carry pricing logic, dietary tagging, tax, prep time,
                      stock policy, channels, and outlet scope.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-white px-4 py-3">
                    <p className="font-semibold text-text-primary">
                      {builder.summary.comboCount} combos configured
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Combos are stored separately so you can upsell bundles without flattening
                      them into the core item model.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-white px-4 py-3">
                    <p className="font-semibold text-text-primary">
                      {builder.summary.inventoryLinkedCount} items linked to stock
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      This is the base for automatic stock deduction, out-of-stock shutdowns, and
                      low inventory alerts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="label-text">Catalog operations</p>
            <h3 className="mt-2 text-lg font-semibold text-text-primary">
              Manage categories, pricing, and service availability
            </h3>
          </div>

          <div className="rounded-[20px] border border-border-subtle bg-bg-surface p-4">
            <p className="label-text">Category CRUD</p>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={saveCategory} disabled={isPending} className="flex-1">
                  {editingCategoryId ? "Update category" : "Add category"}
                </Button>
                {editingCategoryId ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryName("");
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-border-subtle bg-white px-3 py-3"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">{category.name}</p>
                      <p>Sort {category.sortOrder ?? 0}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEditCategory(category)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => removeCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-border-subtle bg-bg-surface p-4">
            <p className="label-text">Quick add item</p>
            <div className="mt-4 space-y-4">
              {!editingItemId ? (
                <div className="grid gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl border border-border-subtle bg-white p-4">
                    <p className="label-text">1. Select menu</p>
                    <select
                      className="mt-3 h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                      value={menuId}
                      onChange={(e) => handleMenuChange(e.target.value)}
                    >
                      {builder.tree.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-2xl border border-border-subtle bg-white p-4">
                    <p className="label-text">2. Select category</p>
                    <select
                      className="mt-3 h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                      value={builderCategoryId}
                      onChange={(e) => handleBuilderCategoryChange(e.target.value)}
                    >
                      {builderCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-2xl border border-border-subtle bg-white p-4">
                    <p className="label-text">3. Select subcategory</p>
                    <select
                      className="mt-3 h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                    >
                      <option value="">No subcategory</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border-subtle bg-white p-4">
                  <p className="label-text">Edit mode</p>
                  <p className="mt-2 text-sm text-text-secondary">
                    Existing catalog items still edit through the classic category flow.
                  </p>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.9fr_auto]">
                <Input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
                <select
                  className="h-10 rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!editingItemId}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button onClick={saveItem} disabled={isPending} className="flex-1">
                    {editingItemId ? "Update item" : "Add into hierarchy"}
                  </Button>
                  {editingItemId ? (
                    <Button variant="ghost" onClick={resetItemForm}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>

              {!editingItemId && selectedMenu && selectedBuilderCategory ? (
                <div className="rounded-2xl border border-border-subtle bg-white px-4 py-3">
                  <p className="label-text">Current placement</p>
                  <p className="mt-2 text-sm text-text-primary">
                    {selectedMenu.name} {"->"} {selectedBuilderCategory.name}
                    {selectedSubcategory ? ` -> ${selectedSubcategory.name}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    New items inherit channels from this branch:{" "}
                    {(selectedSubcategory?.channels?.length
                      ? selectedSubcategory.channels
                      : selectedBuilderCategory.channels?.length
                        ? selectedBuilderCategory.channels
                        : selectedMenu.channels
                    ).join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label-text">Catalog</p>
            <CardTitle className="mt-2">Active menu inventory</CardTitle>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <select
              className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none md:w-52"
              value={catalogCategoryId}
              onChange={(e) => setCatalogCategoryId(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Search menu items..."
              className="w-full md:w-72"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const category = categories.find((entry) => entry.id === item.categoryId);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-text-primary">{item.name}</TableCell>
                    <TableCell>{category?.name ?? "Uncategorized"}</TableCell>
                    <TableCell className="text-right font-medium text-text-primary">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isAvailable ? "success" : "warning"}>
                        {item.isAvailable ? "Live" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => startEditItem(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => removeItem(item.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => toggleAvailability(item.id)}
                        >
                          {item.isAvailable ? "Pause" : "Resume"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
