"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Package,
  Settings,
  Lightbulb,
  CheckCircle2,
  Info,
  XCircle,
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Suggestion = {
  id: string;
  category: "revenue" | "inventory" | "customers" | "operations";
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  message: string;
  action?: string;
};

const CATEGORY_CONFIG = {
  revenue: {
    icon: TrendingUp,
    label: "Revenue",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  inventory: {
    icon: Package,
    label: "Inventory",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  customers: {
    icon: Users,
    label: "Customers",
    color: "text-violet-500",
    bg: "bg-violet-500/10"
  },
  operations: {
    icon: Settings,
    label: "Operations",
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  }
};

const SEVERITY_CONFIG = {
  critical: {
    icon: XCircle,
    label: "Critical",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    badge: "bg-red-500/10 text-red-500"
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-500"
  },
  info: {
    icon: Info,
    label: "Info",
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-500"
  },
  positive: {
    icon: CheckCircle2,
    label: "Positive",
    color: "text-emerald-500",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-500"
  }
};

export default function InsightsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggestions");
      const json = await res.json();
      if (json.success) {
        setSuggestions(json.data.suggestions);
        setGeneratedAt(json.data.generatedAt);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const filtered =
    filter === "all"
      ? suggestions
      : suggestions.filter((s) => s.category === filter);

  const criticalCount = suggestions.filter((s) => s.severity === "critical").length;
  const warningCount = suggestions.filter((s) => s.severity === "warning").length;
  const positiveCount = suggestions.filter((s) => s.severity === "positive").length;

  const categoryCounts = {
    revenue: suggestions.filter((s) => s.category === "revenue").length,
    inventory: suggestions.filter((s) => s.category === "inventory").length,
    customers: suggestions.filter((s) => s.category === "customers").length,
    operations: suggestions.filter((s) => s.category === "operations").length
  };

  return (
    <>
      {/* Header */}
      <div className="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">AI Insights</h2>
            <p className="text-sm text-text-muted">
              {suggestions.length} suggestions · Rule-based analysis of your data
              {generatedAt && (
                <span className="ml-1">
                  ·{" "}
                  {new Date(generatedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Regenerate
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{criticalCount}</p>
              <p className="text-xs text-text-muted">Critical</p>
            </div>
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{warningCount}</p>
              <p className="text-xs text-text-muted">Warnings</p>
            </div>
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{positiveCount}</p>
              <p className="text-xs text-text-muted">Positive</p>
            </div>
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{suggestions.length}</p>
              <p className="text-xs text-text-muted">Total Insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="surface-card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              filter === "all"
                ? "bg-accent-primary text-white"
                : "border border-border-subtle text-text-muted hover:bg-bg-surface"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            All ({suggestions.length})
          </button>
          {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  filter === cat
                    ? cn(config.bg, config.color)
                    : "border border-border-subtle text-text-muted hover:bg-bg-surface"
                )}
              >
                <config.icon className="h-3.5 w-3.5" />
                {config.label} ({categoryCounts[cat]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggestions List */}
      {loading ? (
        <div className="surface-card flex items-center justify-center py-16">
          <div className="text-center">
            <Brain className="mx-auto h-8 w-8 animate-pulse text-indigo-500 mb-3" />
            <p className="text-sm text-text-muted">Analyzing your data...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-10 w-10 text-text-muted/30 mb-4" />
          <p className="text-sm text-text-muted">
            {suggestions.length === 0
              ? "Not enough data to generate insights yet. Keep using the POS!"
              : "No suggestions in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((suggestion) => {
            const severityCfg = SEVERITY_CONFIG[suggestion.severity];
            const categoryCfg = CATEGORY_CONFIG[suggestion.category];
            const SeverityIcon = severityCfg.icon;
            const CategoryIcon = categoryCfg.icon;

            return (
              <div
                key={suggestion.id}
                className={cn(
                  "surface-card overflow-hidden border-l-4 p-5",
                  severityCfg.border,
                  severityCfg.bg
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                      categoryCfg.bg
                    )}
                  >
                    <CategoryIcon className={cn("h-5 w-5", categoryCfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-text-primary">{suggestion.title}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          severityCfg.badge
                        )}
                      >
                        <SeverityIcon className="h-2.5 w-2.5" />
                        {severityCfg.label}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          categoryCfg.bg,
                          categoryCfg.color
                        )}
                      >
                        {categoryCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {suggestion.message}
                    </p>
                    {suggestion.action && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent-primary">
                        <Lightbulb className="h-3.5 w-3.5" />
                        {suggestion.action}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
