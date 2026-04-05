 "use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillCloneSettingsCard } from "@/components/settings/bill-clone-settings-card";

type UploadResponse = {
  success: boolean;
  data?: {
    text: string;
    extracted: {
      categories: Array<{ name: string; items: Array<{ name: string; price: number }> }>;
    };
    log: any;
    error?: string;
  };
  error?: string;
};

export default function OnboardingPage() {
  const params = useSearchParams();
  const rid = params.get("rid") || "";

  const [isUploading, setIsUploading] = useState(false);
  const [filesCount, setFilesCount] = useState(0);
  const [menuExtract, setMenuExtract] = useState<null | {
    categories: Array<{ name: string; items: Array<{ name: string; price: number }> }>;
  }>(null);
  const [saveMsg, setSaveMsg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function removeCategory(name: string) {
    if (!menuExtract) return;
    setMenuExtract({
      categories: menuExtract.categories.filter((c) => c.name !== name)
    });
  }

  function removeItem(catName: string, idx: number) {
    if (!menuExtract) return;
    setMenuExtract({
      categories: menuExtract.categories.map((c) =>
        c.name === catName ? { ...c, items: c.items.filter((_, i) => i !== idx) } : c
      )
    });
  }

  async function uploadMenuImages(files: FileList) {
    setError("");
    setSaveMsg("");
    setMenuExtract(null);
    if (!files || files.length === 0) return;
    setFilesCount(files.length);
    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f, f.name));
      const res = await fetch("/api/menu/import/upload", { method: "POST", body: form });
      const payload = (await res.json()) as UploadResponse;
      const data = payload?.data;
      if (!res.ok || !payload?.success || data?.error) {
        setError(data?.error ?? payload?.error ?? "Menu OCR failed");
        return;
      }
      setMenuExtract({ categories: data?.extracted?.categories ?? [] });
    } catch (e) {
      setError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveExtracted() {
    setError("");
    setSaveMsg("");
    if (!menuExtract?.categories?.length) {
      setError("Nothing to save. Upload and extract first.");
      return;
    }
    const shaped = menuExtract.categories.map((c) => ({
      name: c.name,
      items: (c.items ?? []).map((i) => ({ name: i.name, price: i.price }))
    }));
    try {
      const res = await fetch("/api/menu/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: shaped })
      });
      const payload = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { created?: any; error?: string }; error?: string };
      if (!res.ok || !payload?.success) {
        const serverMsg = (payload?.data as any)?.error || payload?.error;
        setError(serverMsg ?? `Save failed (${res.status})`);
        return;
      }
      setSaveMsg("Menu saved. You can adjust categories/items later.");
    } catch {
      setError("Save failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <p className="label-text">Onboarding</p>
              <CardTitle className="mt-1">Step 1 — Upload your menu (5–10 images)</CardTitle>
            </div>
            {rid ? <Badge variant="neutral">Workspace: {rid.slice(-6)}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-900">{error}</div> : null}
          {saveMsg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">{saveMsg}</div> : null}
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm font-semibold text-text-primary transition hover:bg-bg-surface">
            {isUploading ? "Processing..." : "Upload images"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              disabled={isUploading}
              onChange={(e) => {
                const list = e.target.files;
                if (!list) return;
                void uploadMenuImages(list);
                e.target.value = "";
              }}
            />
          </label>
          <div className="text-sm text-text-secondary">{filesCount ? `${filesCount} selected` : "No files selected"}</div>
          {menuExtract ? (
            <div className="rounded-2xl border border-border-subtle bg-white p-3">
              <p className="font-semibold">Detected categories/items</p>
              <ul className="mt-2 space-y-2 text-sm">
                {menuExtract.categories.map((c) => {
                  const isOpen = expanded[c.name] ?? false;
                  return (
                    <li key={c.name} className="rounded-xl border border-border-subtle p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-text-primary hover:underline"
                            onClick={() => setExpanded((e) => ({ ...e, [c.name]: !isOpen }))}
                            aria-expanded={isOpen}
                          >
                            <span className="font-semibold">{c.name}</span>
                            <span className="ml-2 text-text-secondary">({c.items?.length ?? 0} items)</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            onClick={() => removeCategory(c.name)}
                          >
                            Remove category
                          </button>
                        </div>
                      </div>
                      {isOpen ? (
                        <ul className="mt-2 divide-y divide-border-subtle rounded-lg border border-border-subtle">
                          {c.items.map((it, idx) => (
                            <li key={`${c.name}-${idx}`} className="flex items-center justify-between px-2 py-1">
                              <div className="truncate">
                                <span className="font-medium text-text-primary">{it.name}</span>
                                <span className="ml-2 text-text-secondary">₹{it.price.toFixed(2)}</span>
                              </div>
                              <button
                                type="button"
                                className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                                onClick={() => removeItem(c.name, idx)}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                          {c.items.length === 0 ? (
                            <li className="px-2 py-2 text-xs text-text-secondary">No items left in this category.</li>
                          ) : null}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button className="h-10 rounded-2xl" onClick={() => void saveExtracted()}>
                  Save to menu
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <BillCloneSettingsCard
        restaurantName="Your Restaurant"
        restaurantId={rid || undefined}
        onTemplateSaved={() => {
          // After saving receipt template, send to Orders
          window.location.href = "/orders";
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Billing setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-text-secondary">Use your saved receipt template. You can always adjust tax and printer later in Settings.</p>
          <div className="text-sm">
            When you’re ready, go to Orders and try “Print bill” to verify the layout.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

