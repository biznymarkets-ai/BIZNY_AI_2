import { useState, useMemo } from "react";
import { Search, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDUSTRY_TAXONOMY, getStamps } from "@/data/industries";

interface Props {
  selected: string[];
  onChange: (stamps: string[]) => void;
  max?: number;
  compact?: boolean;
}

export default function IndustryStampSelector({ selected, onChange, max = 5, compact = false }: Props) {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [activeSubSector, setActiveSubSector] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const toggle = (stamp: string) => {
    if (selected.includes(stamp)) {
      onChange(selected.filter(s => s !== stamp));
    } else if (selected.length < max) {
      onChange([...selected, stamp]);
    }
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (!val || selected.includes(val) || selected.length >= max) return;
    onChange([...selected, val]);
    setCustomInput("");
    setShowCustom(false);
  };

  const subSectors = useMemo(() => {
    if (!activeSector) return [];
    return INDUSTRY_TAXONOMY.find(s => s.sector === activeSector)?.subSectors ?? [];
  }, [activeSector]);

  const visibleStamps = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return INDUSTRY_TAXONOMY.flatMap(s =>
        s.subSectors.flatMap(ss => ss.stamps.filter(st => st.toLowerCase().includes(q)))
      );
    }
    if (activeSector) {
      return getStamps(activeSector, activeSubSector ?? undefined);
    }
    return INDUSTRY_TAXONOMY.flatMap(s => s.subSectors.flatMap(ss => ss.stamps.slice(0, 3)));
  }, [search, activeSector, activeSubSector]);

  const maxed = selected.length >= max;

  return (
    <div className="space-y-3">
      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              {s} <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveSector(null); setActiveSubSector(null); }}
          placeholder="Search industry stamps..."
          className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {!search && (
        <>
          {/* Sector pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => { setActiveSector(null); setActiveSubSector(null); }}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap",
                !activeSector ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {INDUSTRY_TAXONOMY.map(sec => (
              <button
                key={sec.sector}
                type="button"
                onClick={() => { setActiveSector(sec.sector); setActiveSubSector(null); }}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap",
                  activeSector === sec.sector ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {sec.sector}
              </button>
            ))}
          </div>

          {/* Sub-sector pills */}
          {activeSector && subSectors.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveSubSector(null)}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors whitespace-nowrap",
                  !activeSubSector ? "bg-foreground text-background border-foreground" : "bg-background border-border text-muted-foreground hover:text-foreground"
                )}
              >
                All {activeSector}
              </button>
              {subSectors.map(ss => (
                <button
                  key={ss.label}
                  type="button"
                  onClick={() => setActiveSubSector(ss.label)}
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors whitespace-nowrap",
                    activeSubSector === ss.label ? "bg-foreground text-background border-foreground" : "bg-background border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {ss.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Stamps grid */}
      <div className={cn("grid gap-1.5 overflow-y-auto", compact ? "grid-cols-2 max-h-40" : "grid-cols-2 max-h-52")}>
        {visibleStamps.map(stamp => {
          const sel = selected.includes(stamp);
          return (
            <button
              key={stamp}
              type="button"
              onClick={() => toggle(stamp)}
              disabled={maxed && !sel}
              className={cn(
                "px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all leading-snug",
                sel ? "bg-primary/5 border-primary text-primary" :
                maxed ? "bg-muted/30 border-border text-muted-foreground/40 cursor-not-allowed" :
                "bg-muted/30 border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              {sel && <span className="mr-1 text-primary">✓</span>}{stamp}
            </button>
          );
        })}
      </div>

      {visibleStamps.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">No results. Add a custom stamp below.</p>
      )}

      {/* Custom stamp */}
      {!showCustom ? (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add custom industry stamp
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="e.g. Bamboo Furniture Production"
            className="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim() || maxed}
            className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40"
          >
            Add
          </button>
          <button type="button" onClick={() => setShowCustom(false)} className="px-2 h-9 rounded-lg border border-border text-xs text-muted-foreground">
            Cancel
          </button>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">{selected.length}/{max} selected</p>
    </div>
  );
}
