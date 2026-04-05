"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";

type MenuCategory = { id: string; name: string; sortOrder?: number };
type MenuItem = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  isAvailable: boolean;
  isActive?: boolean;
  taxRate?: number;
  tags?: string[];
  sortOrder?: number;
  pricingMode?: "base" | "variant";
};
type BuilderItem = {
  id: string;
  name: string;
  dietary: string;
  pricingMode: string;
  prepTimeMinutes: number;
  variants: Array<{ id: string; groupName: string; optionName: string }>;
};
type BuilderSubcategory = { id: string; name: string; channels: string[]; dayParts: string[]; items: BuilderItem[] };
type BuilderCategory = { id: string; name: string; channels: string[]; dayParts: string[]; items: BuilderItem[]; subcategories: BuilderSubcategory[] };
type BuilderMenu = { id: string; name: string; description: string; channels: string[]; dayParts: string[]; outletIds?: string[]; categories: BuilderCategory[] };
type BuilderWorkspace = {
  summary: { menuCount: number; categoryCount: number; subcategoryCount: number; itemCount: number; variantCount: number; addonGroupCount: number };
  tree: BuilderMenu[];
};
type VariantDraft = { id: string; groupName: string; optionName: string; variantType: "size" | "quantity" | "custom"; priceDelta: string };
type AddonDraft = { id: string; groupName: string; selectionType: "single" | "multi"; addonName: string; price: string };

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function parseVariantDrafts(value: VariantDraft[]) {
  return value.filter((variant) => variant.groupName.trim() && variant.optionName.trim()).map((variant, index) => ({
      groupName: variant.groupName.trim(),
      optionName: variant.optionName.trim(),
      variantType: variant.variantType,
    // Treat entered value as the absolute price for that variant (most common expectation in POS menus).
    // The API supports both absolutePrice and priceDelta; we keep priceDelta at 0 by default.
    absolutePrice: Number(variant.priceDelta) || 0,
    priceDelta: 0,
      sortOrder: index + 1,
      isDefault: index === 0,
      isActive: true
    }));
}

function parseAddonDrafts(value: AddonDraft[]) {
  const groups = new Map<string, { name: string; selectionType: "single" | "multi"; minSelect: number; maxSelect: number; required: boolean; sortOrder: number; isActive: boolean; addons: Array<{ name: string; price: number; sortOrder: number; isActive: boolean }> }>();
  value.filter((addon) => addon.groupName.trim() && addon.addonName.trim()).forEach((addon, index) => {
      const groupName = addon.groupName.trim();
      const addonName = addon.addonName.trim();
    if (!groupName || !addonName) return;
      if (!groups.has(groupName)) {
      groups.set(groupName, { name: groupName, selectionType: addon.selectionType === "single" ? "single" : "multi", minSelect: 0, maxSelect: addon.selectionType === "single" ? 1 : 5, required: false, sortOrder: groups.size + 1, isActive: true, addons: [] });
      }
    groups.get(groupName)?.addons.push({ name: addonName, price: Number(addon.price) || 0, sortOrder: index + 1, isActive: true });
    });
  return Array.from(groups.values());
}

function countItems(menu: BuilderMenu) {
  return menu.categories.reduce((sum, category) => sum + category.items.length + category.subcategories.reduce((subSum, subcategory) => subSum + subcategory.items.length, 0), 0);
}

export function MenuOperatingEnginePage({ categories, items, builder }: { categories: MenuCategory[]; items: MenuItem[]; builder: BuilderWorkspace }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workspace, setWorkspace] = useState(builder);
  const [selectedMenuId, setSelectedMenuId] = useState(builder.tree[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(builder.tree[0]?.categories[0]?.id ?? "");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(builder.tree.length ? 2 : 1);
  const [menuName, setMenuName] = useState("");
  const [menuDescription, setMenuDescription] = useState("");
  const [nodeType, setNodeType] = useState<"category" | "subcategory">("category");
  const [nodeName, setNodeName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDietary, setItemDietary] = useState("none");
  const [itemPrepTime, setItemPrepTime] = useState("10");
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [addons, setAddons] = useState<AddonDraft[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategoryId, setCatalogCategoryId] = useState("all");
  const [catalogPageSize, setCatalogPageSize] = useState<10 | 20 | 50>(10);
  const [catalogPage, setCatalogPage] = useState(1);
  const [structureMessage, setStructureMessage] = useState("");
  const [structureError, setStructureError] = useState("");
  const [itemMessage, setItemMessage] = useState("");
  const [itemError, setItemError] = useState("");
  const [ocrPending, setOcrPending] = useState(false);
  const [editCatalogItem, setEditCatalogItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editIsAvailable, setEditIsAvailable] = useState(true);

  useEffect(() => setWorkspace(builder), [builder]);

  const selectedMenu = useMemo(() => workspace.tree.find((entry) => entry.id === selectedMenuId) ?? workspace.tree[0], [selectedMenuId, workspace]);
  const selectedCategory = useMemo(() => selectedMenu?.categories.find((entry) => entry.id === selectedCategoryId) ?? selectedMenu?.categories[0], [selectedCategoryId, selectedMenu]);
  const selectedSubcategory = useMemo(() => selectedCategory?.subcategories.find((entry) => entry.id === selectedSubcategoryId), [selectedCategory, selectedSubcategoryId]);
  const availableHierarchyCategories = selectedMenu?.categories ?? [];
  const branchItems = selectedSubcategory?.items ?? selectedCategory?.items ?? [];
  const inheritedChannels = selectedSubcategory?.channels?.length ? selectedSubcategory.channels : selectedCategory?.channels?.length ? selectedCategory.channels : selectedMenu?.channels ?? ["pos"];
  const inheritedDayParts = selectedSubcategory?.dayParts?.length ? selectedSubcategory.dayParts : selectedCategory?.dayParts?.length ? selectedCategory.dayParts : selectedMenu?.dayParts ?? ["all_day"];
  const canAccessStep2 = workspace.tree.length > 0;
  const canAccessStep3 = Boolean(selectedMenu && availableHierarchyCategories.length > 0);
  const currentPlacement = [selectedMenu?.name ?? "No menu", selectedCategory?.name ?? "No category", selectedSubcategory?.name].filter(Boolean).join(" / ");
  const filteredItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(catalogQuery.toLowerCase()) && (catalogCategoryId === "all" || item.categoryId === catalogCategoryId)), [catalogCategoryId, catalogQuery, items]);

  useEffect(() => {
    setCatalogPage(1);
  }, [catalogCategoryId, catalogQuery, catalogPageSize]);

  const catalogTotalItems = filteredItems.length;
  const catalogTotalPages = Math.max(1, Math.ceil(catalogTotalItems / catalogPageSize));
  const catalogPageSafe = Math.min(catalogPage, catalogTotalPages);
  const catalogStartIndex = (catalogPageSafe - 1) * catalogPageSize;
  const pagedItems = useMemo(
    () => filteredItems.slice(catalogStartIndex, catalogStartIndex + catalogPageSize),
    [catalogPageSize, catalogStartIndex, filteredItems]
  );

  useEffect(() => {
    if (!selectedMenu) return;
    const hasSelectedCategory = availableHierarchyCategories.some((category) => category.id === selectedCategoryId);
    if (!hasSelectedCategory) {
      setSelectedCategoryId(availableHierarchyCategories[0]?.id ?? "");
      setSelectedSubcategoryId("");
    }
  }, [availableHierarchyCategories, selectedCategoryId, selectedMenu]);

  useEffect(() => {
    if (!selectedCategory) {
      setSelectedSubcategoryId("");
      return;
    }
    if (selectedSubcategoryId && !selectedCategory.subcategories.some((subcategory) => subcategory.id === selectedSubcategoryId)) {
      setSelectedSubcategoryId("");
    }
  }, [selectedCategory, selectedSubcategoryId]);

  useEffect(() => {
    if (step === 2 && !canAccessStep2) setStep(1);
    if (step === 3 && !canAccessStep3) setStep(canAccessStep2 ? 2 : 1);
  }, [canAccessStep2, canAccessStep3, step]);

  async function reloadWorkspace(options?: { nextMenuId?: string; nextCategoryId?: string; nextSubcategoryId?: string }) {
    const response = await fetch("/api/menu/builder", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { data?: BuilderWorkspace };
    const nextWorkspace = payload.data;
    if (!nextWorkspace) return;
    setWorkspace(nextWorkspace);
    const resolvedMenuId = options?.nextMenuId && nextWorkspace.tree.some((menu) => menu.id === options.nextMenuId) ? options.nextMenuId : nextWorkspace.tree[0]?.id ?? "";
    setSelectedMenuId(resolvedMenuId);
    const resolvedMenu = nextWorkspace.tree.find((menu) => menu.id === resolvedMenuId);
    const resolvedCategoryId = options?.nextCategoryId && resolvedMenu?.categories.some((category) => category.id === options.nextCategoryId) ? options.nextCategoryId : resolvedMenu?.categories[0]?.id ?? "";
    setSelectedCategoryId(resolvedCategoryId);
    const resolvedCategory = resolvedMenu?.categories.find((category) => category.id === resolvedCategoryId);
    const resolvedSubcategoryId = options?.nextSubcategoryId && resolvedCategory?.subcategories.some((subcategory) => subcategory.id === options.nextSubcategoryId) ? options.nextSubcategoryId : "";
    setSelectedSubcategoryId(resolvedSubcategoryId);
  }

  async function importFromImage(file: File) {
    setStructureError("");
    setStructureMessage("");
    setOcrPending(true);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("menuName", menuName.trim() || "Imported Menu");
      const response = await fetch("/api/menu/ocr/import", {
        method: "POST",
        body: form
      });
      const payload = (await response.json()) as any;
      if (!response.ok) {
        setStructureError(payload?.data?.error ?? payload?.error ?? "OCR import failed.");
        return;
      }
      const created = payload?.data?.created;
      setStructureMessage(
        `Imported successfully: ${created?.categories ?? 0} categories, ${created?.items ?? 0} items, ${created?.variants ?? 0} variants.`
      );
      if (payload?.data?.workspace?.tree) {
        setWorkspace(payload.data.workspace);
        const nextMenuId = payload.data.menuId;
        setSelectedMenuId(nextMenuId);
        setSelectedCategoryId(payload.data.workspace.tree.find((m: any) => m.id === nextMenuId)?.categories?.[0]?.id ?? "");
        setSelectedSubcategoryId("");
      } else {
        await reloadWorkspace();
      }
      setStep(2);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      setStructureError("OCR import request failed.");
    } finally {
      setOcrPending(false);
    }
  }

  async function createMenu() {
    if (!menuName.trim()) return;
    setStructureError("");
    setStructureMessage("");
    try {
      const response = await fetch("/api/menu/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: menuName, description: menuDescription, channels: ["pos", "website", "qr"], outletIds: ["main-outlet"], dayParts: ["all_day"], serviceModes: ["dine_in", "takeaway", "delivery"], isDefault: workspace.tree.length === 0, isActive: true, sortOrder: workspace.tree.length + 1 })
      });
      const result = (await response.json()) as { data?: { id: string; name: string }; error?: string };
      if (response.ok && result.data) {
        await reloadWorkspace({ nextMenuId: result.data.id });
        setStructureMessage(`Menu "${result.data.name}" created.`);
        setMenuName("");
        setMenuDescription("");
        setStep(2);
        startTransition(() => router.refresh());
        return;
      }
      setStructureError(result.error ?? "Menu could not be created.");
    } catch {
      setStructureError("Menu request failed before the server could complete it.");
    }
  }

  async function createNode() {
    if (!nodeName.trim() || !selectedMenu) return;
    if (nodeType === "subcategory" && !selectedCategory) return;
    setStructureError("");
    setStructureMessage("");
    try {
      const response = await fetch("/api/menu/builder/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: selectedMenu.id, parentId: nodeType === "subcategory" ? selectedCategory?.id : undefined, name: nodeName, nodeType, level: nodeType === "subcategory" ? 1 : 0, path: nodeType === "subcategory" && selectedCategory ? [selectedCategory.name, nodeName] : [nodeName], channels: nodeType === "subcategory" && selectedCategory ? selectedCategory.channels : selectedMenu.channels, dayParts: nodeType === "subcategory" && selectedCategory ? selectedCategory.dayParts : selectedMenu.dayParts, outletIds: selectedMenu.outletIds ?? ["main-outlet"], sortOrder: nodeType === "subcategory" ? (selectedCategory?.subcategories.length ?? 0) + 1 : selectedMenu.categories.length + 1, isActive: true })
      });
      const result = (await response.json()) as { data?: { id: string; name: string }; error?: string };
      if (response.ok && result.data) {
        await reloadWorkspace({ nextMenuId: selectedMenu.id, nextCategoryId: nodeType === "category" ? result.data.id : selectedCategory?.id, nextSubcategoryId: nodeType === "subcategory" ? result.data.id : "" });
        setStructureMessage(nodeType === "category" ? `Category "${result.data.name}" created.` : `Subcategory "${result.data.name}" created.`);
        setNodeName("");
        setStep(3);
        startTransition(() => router.refresh());
        return;
      }
      setStructureError(result.error ?? "Structure could not be created.");
    } catch {
      setStructureError("Category request failed before the server could complete it.");
    }
  }

  async function createHierarchyItem() {
    if (!itemName.trim() || !itemPrice || !selectedMenu || !selectedCategory) return;
    setItemError("");
    setItemMessage("");
    try {
      const response = await fetch("/api/menu/builder/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: selectedMenu.id, categoryId: selectedCategory.id, subcategoryId: selectedSubcategory?.id || undefined, name: itemName, price: Number(itemPrice), taxRate: 8, itemType: "standard", dietary: itemDietary, pricingMode: parseVariantDrafts(variants).length ? "variant" : "base", prepTimeMinutes: Number(itemPrepTime) || 10, isAvailable: true, isActive: true, autoDisableOnOutOfStock: false, dayParts: inheritedDayParts, channels: inheritedChannels, outletIds: selectedMenu.outletIds?.length ? selectedMenu.outletIds : ["main-outlet"], tags: [], metadata: { bestSellerScore: 0, lowPerformerScore: 0, suggestedComboScore: 0 }, sortOrder: branchItems.length + 1, variants: parseVariantDrafts(variants), addonGroups: parseAddonDrafts(addons), inventoryMappings: [] })
      });
      if (response.ok) {
        await reloadWorkspace({ nextMenuId: selectedMenu.id, nextCategoryId: selectedCategory.id, nextSubcategoryId: selectedSubcategory?.id });
        setItemMessage(`Item "${itemName}" created in the selected branch.`);
    setItemName("");
    setItemPrice("");
    setItemDietary("none");
    setItemPrepTime("10");
    setVariants([]);
    setAddons([]);
    startTransition(() => router.refresh());
        return;
      }
      const result = (await response.json()) as { error?: string };
      setItemError(result.error ?? "Item could not be created.");
    } catch {
      setItemError("Item request failed before the server could complete it.");
    }
  }

  async function toggleAvailability(id: string) {
    await fetch(`/api/menu/items/${id}/toggle-availability`, { method: "POST" });
    startTransition(() => router.refresh());
  }

  async function removeItem(id: string) {
    await fetch(`/api/menu/items/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  function openEditItem(item: MenuItem) {
    setEditCatalogItem(item);
    setEditName(item.name);
    setEditPrice(String(item.price ?? ""));
    setEditCategoryId(item.categoryId);
    setEditIsAvailable(Boolean(item.isAvailable));
  }

  async function saveEditedItem() {
    if (!editCatalogItem) return;
    const name = editName.trim();
    const price = Number(editPrice);
    if (name.length < 2 || !Number.isFinite(price) || price < 0) {
      return;
    }

    const payload = {
      categoryId: editCategoryId || editCatalogItem.categoryId,
      name,
      price,
      taxRate: editCatalogItem.taxRate ?? 0,
      isAvailable: editIsAvailable,
      isActive: editCatalogItem.isActive ?? true,
      tags: editCatalogItem.tags ?? [],
      sortOrder: editCatalogItem.sortOrder ?? 0,
      pricingMode: editCatalogItem.pricingMode ?? "base"
    };

    await fetch(`/api/menu/items/${editCatalogItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setEditCatalogItem(null);
    startTransition(() => router.refresh());
  }

  async function removeMenu(menuId: string) {
    const confirmed = window.confirm(
      "Delete this menu and ALL its categories/items? This cannot be undone."
    );
    if (!confirmed) return;
    await fetch(`/api/menu/menus/${menuId}`, { method: "DELETE" });
    await reloadWorkspace();
    startTransition(() => router.refresh());
  }

  async function removeNode(categoryId: string) {
    const confirmed = window.confirm(
      "Delete this category/subcategory and ALL items under it? This cannot be undone."
    );
    if (!confirmed) return;
    await fetch(`/api/menu/builder/categories/${categoryId}`, { method: "DELETE" });
    await reloadWorkspace();
    startTransition(() => router.refresh());
  }

  function chooseMenu(menuId: string) {
    const menu = workspace.tree.find((entry) => entry.id === menuId) ?? workspace.tree[0];
    setSelectedMenuId(menu?.id ?? "");
    setSelectedCategoryId(menu?.categories[0]?.id ?? "");
    setSelectedSubcategoryId("");
  }

  function addVariantRow() {
    setVariants((current) => [...current, { id: crypto.randomUUID(), groupName: "", optionName: "", variantType: "custom", priceDelta: "" }]);
  }

  function updateVariantRow(id: string, field: keyof VariantDraft, value: string) {
    setVariants((current) => current.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)));
  }

  function removeVariantRow(id: string) {
    setVariants((current) => current.filter((variant) => variant.id !== id));
  }

  function addAddonRow() {
    setAddons((current) => [...current, { id: crypto.randomUUID(), groupName: "", selectionType: "multi", addonName: "", price: "" }]);
  }

  function updateAddonRow(id: string, field: keyof AddonDraft, value: string) {
    setAddons((current) => current.map((addon) => (addon.id === id ? { ...addon, [field]: value } : addon)));
  }

  function removeAddonRow(id: string) {
    setAddons((current) => current.filter((addon) => addon.id !== id));
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-border-subtle bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label-text">Menu tree</p>
            <h2 className="mt-1 text-base font-semibold text-text-primary">Live hierarchy</h2>
          </div>
          <Badge variant="neutral">
            {workspace.summary.menuCount} menus • {workspace.summary.itemCount} items
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          {workspace.tree.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-4 text-sm text-text-secondary">
              Nothing yet — start building
            </div>
          ) : (
            workspace.tree.map((menu) => {
              const isMenuActive = selectedMenu?.id === menu.id;
              return (
                <div key={menu.id} className="rounded-xl border border-border-subtle">
                  <div
                    className={[
                      "flex items-start justify-between gap-3 px-3 py-3",
                      isMenuActive ? "bg-bg-surface" : "bg-white"
                    ].join(" ")}
                  >
                    <button type="button" onClick={() => chooseMenu(menu.id)} className="flex-1 cursor-pointer text-left">
                      <p className="text-sm font-semibold text-text-primary">{menu.name}</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {menu.categories.length} categories • {countItems(menu)} items
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      {isMenuActive ? <Badge variant="success">Selected</Badge> : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => removeMenu(menu.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {isMenuActive ? (
                    <div className="border-t border-border-subtle px-3 py-3">
                      {menu.categories.length === 0 ? (
                        <p className="text-xs text-text-secondary">Add a category to continue.</p>
                      ) : (
                        <div className="space-y-2">
                          {menu.categories.map((category) => {
                            const isCategoryActive = selectedCategory?.id === category.id;
                            return (
                              <div key={category.id}>
                                <div
                                  className={[
                                    "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2",
                                    isCategoryActive ? "bg-bg-surface" : "hover:bg-bg-surface"
                                  ].join(" ")}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedMenuId(menu.id);
                                      setSelectedCategoryId(category.id);
                                      setSelectedSubcategoryId("");
                                    }}
                                    className="flex-1 cursor-pointer text-left"
                                  >
                                    <p className="text-sm font-medium text-text-primary">{category.name}</p>
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="neutral">
                                      {category.items.length +
                                        category.subcategories.reduce(
                                          (sum, subcategory) => sum + subcategory.items.length,
                                          0
                                        )}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isPending}
                                      onClick={() => removeNode(category.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>

                                {isCategoryActive ? (
                                  <div className="mt-1 space-y-1 pl-3">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubcategoryId("")}
                                      className={[
                                        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs",
                                        selectedSubcategoryId === ""
                                          ? "bg-bg-surface text-text-primary"
                                          : "text-text-secondary hover:bg-bg-surface"
                                      ].join(" ")}
                                    >
                                      <span>All items</span>
                                      <span className="tabular-nums">{category.items.length}</span>
                                    </button>

                                    {category.subcategories.map((subcategory) => (
                                      <div
                                        key={subcategory.id}
                                        className={[
                                          "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs",
                                          selectedSubcategory?.id === subcategory.id
                                            ? "bg-bg-surface text-text-primary"
                                            : "text-text-secondary hover:bg-bg-surface"
                                        ].join(" ")}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedMenuId(menu.id);
                                            setSelectedCategoryId(category.id);
                                            setSelectedSubcategoryId(subcategory.id);
                                          }}
                                          className="flex-1 cursor-pointer text-left"
                                        >
                                          {subcategory.name}
                                        </button>
                                        <span className="tabular-nums">{subcategory.items.length}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={isPending}
                                          onClick={() => removeNode(subcategory.id)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className="space-y-4">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="label-text">Menu builder</p>
                <CardTitle className="mt-1">Build your restaurant menu in 3 steps</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm font-semibold",
                    step === 1
                      ? "border-border-subtle bg-bg-surface text-text-primary"
                      : "border-border-subtle bg-white text-text-secondary",
                    "cursor-pointer hover:bg-bg-surface"
                  ].join(" ")}
                >
                  1. Create menu
                </button>
                <button
                  type="button"
                  disabled={!canAccessStep2}
                  onClick={() => canAccessStep2 && setStep(2)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm font-semibold",
                    step === 2
                      ? "border-border-subtle bg-bg-surface text-text-primary"
                      : "border-border-subtle bg-white text-text-secondary",
                    !canAccessStep2 ? "cursor-not-allowed opacity-60" : "hover:bg-bg-surface"
                  ].join(" ")}
                >
                  2. Category
                </button>
                <button
                  type="button"
                  disabled={!canAccessStep3}
                  onClick={() => canAccessStep3 && setStep(3)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm font-semibold",
                    step === 3
                      ? "border-border-subtle bg-bg-surface text-text-primary"
                      : "border-border-subtle bg-white text-text-secondary",
                    !canAccessStep3 ? "cursor-not-allowed opacity-60" : "hover:bg-bg-surface"
                  ].join(" ")}
                >
                  3. Add items
                </button>
              </div>
            </div>

            {structureMessage ? (
              <div className="rounded-xl border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.12)] px-4 py-3 text-sm font-medium text-success">
                {structureMessage}
              </div>
            ) : null}
            {structureError ? (
              <div className="rounded-xl border border-[rgba(180,35,24,0.25)] bg-[rgba(180,35,24,0.10)] px-4 py-3 text-sm font-medium text-danger">
                {structureError}
              </div>
            ) : null}
            {itemMessage ? (
              <div className="rounded-xl border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.12)] px-4 py-3 text-sm font-medium text-success">
                {itemMessage}
              </div>
            ) : null}
            {itemError ? (
              <div className="rounded-xl border border-[rgba(180,35,24,0.25)] bg-[rgba(180,35,24,0.10)] px-4 py-3 text-sm font-medium text-danger">
                {itemError}
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Create menu</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Start with a parent menu like Main Menu, Breakfast, or Bar.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Import from image (OCR)</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Upload a photo or screenshot of a menu. We’ll detect categories, items, prices, and variants when possible.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-bg-surface">
                        {ocrPending ? "Importing..." : "Upload image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={ocrPending}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void importFromImage(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="label-text">Menu name</p>
                      <Input placeholder="Main Menu" value={menuName} onChange={(e) => setMenuName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <p className="label-text">Description</p>
                      <Input
                        placeholder="All-day menu for dine-in & takeaway"
                        value={menuDescription}
                        onChange={(e) => setMenuDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={createMenu} disabled={isPending} className="min-w-40">
                      Save and continue
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Add category / subcategory</p>
                      <p className="mt-1 text-sm text-text-secondary">Build structure in order so each item has a clear home.</p>
                    </div>
                    <Badge variant="neutral">Current placement: {currentPlacement}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="label-text">Menu</p>
                      <select
                        className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                        value={selectedMenuId}
                        onChange={(e) => chooseMenu(e.target.value)}
                      >
                        {workspace.tree.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <p className="label-text">Type</p>
                      <select
                        className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                        value={nodeType}
                        onChange={(e) => setNodeType(e.target.value as "category" | "subcategory")}
                      >
                        <option value="category">Category</option>
                        <option value="subcategory">Subcategory</option>
                      </select>
                    </div>
                    {nodeType === "subcategory" ? (
                      <div className="space-y-2">
                        <p className="label-text">Parent category</p>
                        <select
                          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none disabled:text-text-secondary"
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          disabled={availableHierarchyCategories.length === 0}
                        >
                          {availableHierarchyCategories.length === 0 ? (
                            <option value="">Create a category first</option>
                          ) : (
                            availableHierarchyCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <p className="label-text">{nodeType === "category" ? "Category name" : "Subcategory name"}</p>
                      <Input
                        placeholder={nodeType === "category" ? "Pizza" : "Veg Pizza"}
                        value={nodeName}
                        onChange={(e) => setNodeName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <Button
                        onClick={createNode}
                        disabled={isPending || (nodeType === "subcategory" && availableHierarchyCategories.length === 0)}
                        className="min-w-40"
                      >
                        {nodeType === "category" ? "Save category" : "Save subcategory"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Add items (variants + add-ons)</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        Add the item, then layer in size options and extras.
                      </p>
                    </div>
                    <div className="w-full max-w-xl rounded-2xl border border-border-subtle bg-bg-surface p-3 md:w-auto">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Current placement</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <select
                          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                          value={selectedCategoryId}
                          onChange={(e) => {
                            setSelectedCategoryId(e.target.value);
                            setSelectedSubcategoryId("");
                          }}
                        >
                          {availableHierarchyCategories.length === 0 ? (
                            <option value="">Create a category first</option>
                          ) : (
                            availableHierarchyCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))
                          )}
                        </select>

                        <select
                          className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none disabled:text-text-secondary"
                          value={selectedSubcategoryId}
                          onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                          disabled={!selectedCategory || (selectedCategory.subcategories?.length ?? 0) === 0}
                        >
                          <option value="">No subcategory</option>
                          {(selectedCategory?.subcategories ?? []).map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="mt-2 text-xs text-text-secondary">
                        {selectedMenu?.name ?? "No menu"} / {selectedCategory?.name ?? "No category"}
                        {selectedSubcategory?.name ? ` / ${selectedSubcategory.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="label-text">Item name</p>
                      <Input placeholder="Margherita" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <p className="label-text">Base price</p>
                      <Input placeholder="299" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <p className="label-text">Dietary</p>
                      <select
                        className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                        value={itemDietary}
                        onChange={(e) => setItemDietary(e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="veg">Veg</option>
                        <option value="non_veg">Non-veg</option>
                        <option value="vegan">Vegan</option>
                        <option value="egg">Egg</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <p className="label-text">Prep time (min)</p>
                      <Input placeholder="10" value={itemPrepTime} onChange={(e) => setItemPrepTime(e.target.value)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Variants</p>
                        <p className="mt-1 text-sm text-text-secondary">Options like size, portion, crust.</p>
                      </div>
                      <Button variant="secondary" onClick={addVariantRow} disabled={isPending}>
                        Add variant
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {variants.length === 0 ? (
                        <div className="rounded-xl border border-border-subtle bg-white px-4 py-4 text-sm text-text-secondary">
                          Example: Size / Small / Size / 0, Size / Medium / Size / 80
                        </div>
                      ) : (
                        variants.map((variant) => (
                          <div key={variant.id} className="rounded-xl border border-border-subtle bg-white p-3">
                            <div className="">
                            <div className="grid grid-cols-5 gap-2">

                                <div className="min-w-0">
                                <Input
                                  placeholder="Group (e.g., Size)"
                                  value={variant.groupName}
                                  onChange={(e) => updateVariantRow(variant.id, "groupName", e.target.value)}
                                />
                              </div>
                                <div className="min-w-0">
                                <Input
                                  placeholder="Option (e.g., Large)"
                                  value={variant.optionName}
                                  onChange={(e) => updateVariantRow(variant.id, "optionName", e.target.value)}
                                />
                              </div>
                                <div className="min-w-0">
                                <select
                                  className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                                  value={variant.variantType}
                                  onChange={(e) => updateVariantRow(variant.id, "variantType", e.target.value)}
                                >
                                  <option value="size">Size</option>
                                  <option value="quantity">Quantity</option>
                                  <option value="custom">Custom</option>
                                </select>
                              </div>
                                <div className="min-w-0">
                                <Input
                                  placeholder="Price +"
                                  value={variant.priceDelta}
                                  onChange={(e) => updateVariantRow(variant.id, "priceDelta", e.target.value)}
                                />
                              </div>
                                <Button
                                  variant="ghost"
                                  onClick={() => removeVariantRow(variant.id)}
                                  className="w-full"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Add-ons</p>
                        <p className="mt-1 text-sm text-text-secondary">Extras like toppings or drink choices.</p>
                      </div>
                      <Button variant="secondary" onClick={addAddonRow} disabled={isPending}>
                        Add add-on
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {addons.length === 0 ? (
                        <div className="rounded-xl border border-border-subtle bg-white px-4 py-4 text-sm text-text-secondary">
                          Example: Toppings / Multi / Extra cheese / 40
                        </div>
                      ) : (
                        addons.map((addon) => (
                          <div key={addon.id} className="rounded-xl border border-border-subtle bg-white p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="min-w-[160px] flex-1">
                                <Input
                                  placeholder="Group (e.g., Toppings)"
                                  value={addon.groupName}
                                  onChange={(e) => updateAddonRow(addon.id, "groupName", e.target.value)}
                                />
                              </div>
                              <div className="min-w-[180px]">
                                <select
                                  className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                                  value={addon.selectionType}
                                  onChange={(e) => updateAddonRow(addon.id, "selectionType", e.target.value)}
                                >
                                  <option value="multi">Multi select</option>
                                  <option value="single">Single select</option>
                                </select>
                              </div>
                              <div className="min-w-[200px] flex-1">
                                <Input
                                  placeholder="Add-on name"
                                  value={addon.addonName}
                                  onChange={(e) => updateAddonRow(addon.id, "addonName", e.target.value)}
                                />
                              </div>
                              <div className="min-w-[140px]">
                                <Input
                                  placeholder="Price +"
                                  value={addon.price}
                                  onChange={(e) => updateAddonRow(addon.id, "price", e.target.value)}
                                />
                              </div>
                              <Button variant="ghost" onClick={() => removeAddonRow(addon.id)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={createHierarchyItem}
                      disabled={isPending || !selectedMenu || !selectedCategory}
                      className="min-w-40"
                    >
                      Save item
                    </Button>
                  </div>
                </div>
              ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border-subtle bg-bg-elevated">
        <CardHeader className="flex flex-col gap-3 border-b border-border-subtle md:flex-row md:items-center md:justify-between">
          <div><p className="label-text">Catalog operations</p><CardTitle className="mt-2">Classic inventory search and live controls</CardTitle></div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <select className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none md:w-52" value={catalogCategoryId} onChange={(e) => setCatalogCategoryId(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <Input placeholder="Search menu items..." className="w-full md:w-72" value={catalogQuery} onChange={(e) => setCatalogQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <p className="label-text">Rows</p>
              <select
                className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary outline-none"
                value={catalogPageSize}
                onChange={(e) => setCatalogPageSize(Number(e.target.value) as 10 | 20 | 50)}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <p className="text-sm text-text-secondary">
                Showing {catalogTotalItems === 0 ? 0 : catalogStartIndex + 1}–{Math.min(catalogStartIndex + catalogPageSize, catalogTotalItems)} of {catalogTotalItems}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={catalogPageSafe <= 1}
                onClick={() => setCatalogPage((value) => Math.max(1, value - 1))}
              >
                Prev
              </Button>
              <Badge variant="neutral">
                Page {catalogPageSafe} / {catalogTotalPages}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                disabled={catalogPageSafe >= catalogTotalPages}
                onClick={() => setCatalogPage((value) => Math.min(catalogTotalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {pagedItems.map((item) => {
                const category = categories.find((entry) => entry.id === item.categoryId);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-text-primary">{item.name}</TableCell>
                    <TableCell>{category?.name ?? "Uncategorized"}</TableCell>
                    <TableCell className="text-right font-medium text-text-primary">{formatCurrency(item.price)}</TableCell>
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
                          onClick={() => openEditItem(item)}
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => removeItem(item.id)}>
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
      </section>
    </div>
      <Modal
      open={Boolean(editCatalogItem)}
      title="Edit menu item"
      description="Update name, price, category, and availability."
      onClose={() => setEditCatalogItem(null)}
      footer={
        <>
          <Button variant="secondary" onClick={() => setEditCatalogItem(null)}>
            Cancel
          </Button>
          <Button disabled={isPending || editName.trim().length < 2} onClick={saveEditedItem}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <p className="label-text">Item name</p>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Item name" />
        </div>
        <div className="space-y-2">
          <p className="label-text">Price</p>
          <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <p className="label-text">Category</p>
          <select
            className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
            value={editCategoryId}
            onChange={(e) => setEditCategoryId(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <p className="label-text">Availability</p>
          <select
            className="h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
            value={editIsAvailable ? "live" : "paused"}
            onChange={(e) => setEditIsAvailable(e.target.value === "live")}
          >
            <option value="live">Live</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>
      </Modal>
    </>
  );
  }
