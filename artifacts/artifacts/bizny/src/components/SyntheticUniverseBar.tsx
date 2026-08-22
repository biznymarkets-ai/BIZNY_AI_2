import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Sparkles,
  Users,
  ChevronRight,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Wrench,
  Flame,
  X,
  ExternalLink,
  Bot,
  Layers,
  Network,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CharacterMeta {
  idKey: string;
  name: string;
  role: string;
  industry: string;
  location: string;
  stateCity: string;
  tagline: string;
  roleInNetwork: string;
  testPrompts: string[];
  dbId?: number | null;
  isSeeded?: boolean;
}

export function SyntheticUniverseBar() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [characters, setCharacters] = useState<CharacterMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/demo/personas");
      if (!res.ok) throw new Error("Failed to load personas");
      const data = await res.json();
      if (data.characters) {
        setCharacters(data.characters);
      }
    } catch (err: any) {
      console.warn("Failed to fetch synthetic universe personas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleSwitchPersona = async (idKey: string) => {
    try {
      setSwitching(idKey);
      const res = await fetch(`/api/demo/switch-persona/${idKey}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to switch persona");
      }
      const data = await res.json();
      if (data.token) {
        login(data.token);
        queryClient.invalidateQueries();
        toast({
          title: `Switched to ${data.user?.name}`,
          description: `Logged in as ${data.user?.role} (${data.user?.businessName || data.user?.industry}).`,
        });
        setIsOpen(false);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error switching persona",
        description: err.message,
      });
    } finally {
      setSwitching(null);
    }
  };

  const currentPersona = characters.find(
    (c) => c.name.toLowerCase() === user?.name?.toLowerCase() || c.dbId === user?.id
  );

  const getPersonaIcon = (idKey: string) => {
    switch (idKey) {
      case "chidi_fabricator":
        return <Wrench className="h-4 w-4 text-amber-500" />;
      case "amara_processor":
        return <Flame className="h-4 w-4 text-emerald-500" />;
      case "fatima_inspector":
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case "emeka_logistics":
        return <Truck className="h-4 w-4 text-indigo-500" />;
      case "ada_retail":
        return <ShoppingCart className="h-4 w-4 text-rose-500" />;
      default:
        return <Users className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <>
      {/* Top Banner Chip */}
      <div className="bg-primary/5 border-b border-primary/15 px-3 py-1.5 flex items-center justify-between text-xs transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/30 font-semibold px-2 py-0.5 text-[10px] shrink-0 uppercase tracking-wider"
          >
            <Sparkles className="h-2.5 w-2.5 mr-1 inline" /> Universe Demo
          </Badge>
          <span className="text-muted-foreground truncate hidden sm:inline">
            Active Persona:
          </span>
          <span className="font-semibold text-foreground truncate flex items-center gap-1.5">
            {currentPersona ? (
              <>
                {getPersonaIcon(currentPersona.idKey)}
                <span>{currentPersona.name}</span>
                <span className="text-muted-foreground font-normal">
                  ({currentPersona.role} · {currentPersona.location})
                </span>
              </>
            ) : (
              <span>{user?.name || "Guest Observer"}</span>
            )}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchCharacters();
            setIsOpen(true);
          }}
          className="h-6 px-2.5 text-[11px] font-medium border-primary/30 text-primary hover:bg-primary/10 shrink-0 gap-1"
        >
          <Network className="h-3 w-3" />
          <span>Switch Persona / Map</span>
        </Button>
      </div>

      {/* Interactive Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Bizny Synthetic Economic Universe
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  An interconnected 5-node African productive network. Switch into any character to experience Bizny's coordination infrastructure and Copilot.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Value Chain Coordination Map */}
          <div className="bg-muted/40 rounded-xl p-4 border border-border mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> Interconnected Value Web
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-[11px]">
              <div className="p-2.5 rounded-lg bg-background border border-amber-500/30 flex flex-col items-center">
                <Wrench className="h-4 w-4 text-amber-500 mb-1" />
                <span className="font-bold text-foreground">1. Chidi</span>
                <span className="text-[10px] text-muted-foreground">Fabrication (Aba)</span>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  Builds Flash Dryer
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-emerald-500/30 flex flex-col items-center">
                <Flame className="h-4 w-4 text-emerald-500 mb-1" />
                <span className="font-bold text-foreground">2. Amara</span>
                <span className="text-[10px] text-muted-foreground">Agro-Processing (Uyo)</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  Refines Cassava & Oil
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-blue-500/30 flex flex-col items-center">
                <ShieldCheck className="h-4 w-4 text-blue-500 mb-1" />
                <span className="font-bold text-foreground">3. Fatima</span>
                <span className="text-[10px] text-muted-foreground">Lab & Quality (Lagos)</span>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  NAFDAC / COA Cert
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-indigo-500/30 flex flex-col items-center">
                <Truck className="h-4 w-4 text-indigo-500 mb-1" />
                <span className="font-bold text-foreground">4. Emeka</span>
                <span className="text-[10px] text-muted-foreground">Haulage (Onitsha)</span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                  5-Ton Freight to Lagos
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-rose-500/30 flex flex-col items-center">
                <ShoppingCart className="h-4 w-4 text-rose-500 mb-1" />
                <span className="font-bold text-foreground">5. Ada</span>
                <span className="text-[10px] text-muted-foreground">FMCG Retail (Lagos)</span>
                <span className="text-[9px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  Off-taker Contracts
                </span>
              </div>
            </div>
          </div>

          {/* Persona List */}
          <div className="space-y-3 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select an Economic Actor to Embody:
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {characters.map((char) => {
                const isSelected =
                  char.name.toLowerCase() === user?.name?.toLowerCase() ||
                  char.dbId === user?.id;

                return (
                  <div
                    key={char.idKey}
                    className={`border rounded-xl p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-muted shrink-0 mt-0.5">
                          {getPersonaIcon(char.idKey)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-sm text-foreground">
                              {char.name}
                            </h5>
                            <Badge variant="outline" className="text-[10px] py-0 px-2">
                              {char.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium">
                              📍 {char.location}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 font-medium mt-1">
                            {char.tagline}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            <strong>Role in Web:</strong> {char.roleInNetwork}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected ? "secondary" : "default"}
                        disabled={switching === char.idKey || isSelected}
                        onClick={() => handleSwitchPersona(char.idKey)}
                        className="shrink-0 h-8 text-xs font-semibold px-3"
                      >
                        {switching === char.idKey ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : isSelected ? (
                          "Active Node"
                        ) : (
                          "Login As Persona"
                        )}
                      </Button>
                    </div>

                    {/* Test Prompts for Copilot */}
                    {char.testPrompts && char.testPrompts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                          <Bot className="h-3 w-3 text-primary" /> Try Copilot Prompts for {char.name.split(" ")[0]}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {char.testPrompts.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={async () => {
                                if (!isSelected) {
                                  await handleSwitchPersona(char.idKey);
                                }
                                setIsOpen(false);
                                setLocation("/copilot");
                              }}
                              className="text-left text-[11px] bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/80 rounded-lg px-2.5 py-1 text-muted-foreground transition-all"
                            >
                              "{prompt}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
