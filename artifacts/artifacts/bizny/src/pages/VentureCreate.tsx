import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateVenture, getListVenturesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight, ChevronLeft, Rocket, Check, Plus, X,
  MapPin, Factory, Target, Users, Wrench,
} from "lucide-react";
import {
  INDUSTRY_SECTORS, SPECIFIC_ACTIVITIES, VALUE_CHAIN_STAGES,
  VENTURE_TYPES, AFRICAN_COUNTRIES, ALL_COUNTRIES,
} from "@/lib/countries";

const STEPS = [
  { id: 1, label: "Venture Basics", icon: <Rocket className="h-4 w-4" /> },
  { id: 2, label: "Industry", icon: <Factory className="h-4 w-4" /> },
  { id: 3, label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { id: 4, label: "Resources", icon: <Wrench className="h-4 w-4" /> },
  { id: 5, label: "Milestones", icon: <Target className="h-4 w-4" /> },
];

interface Milestone { title: string; description: string }

export default function VentureCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVenture = useCreateVenture();

  const [step, setStep] = useState(1);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [ventureType, setVentureType] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  // Step 2
  const [mainIndustry, setMainIndustry] = useState("");
  const [subIndustry, setSubIndustry] = useState("");
  const [activityTag, setActivityTag] = useState("");
  const [valueChainStage, setValueChainStage] = useState("");

  // Step 3
  const [country, setCountry] = useState("");
  const [stateCity, setStateCity] = useState("");
  const [localArea, setLocalArea] = useState("");

  // Step 4
  const [collaboratorsNeeded, setCollaboratorsNeeded] = useState<string[]>([]);
  const [resourcesNeeded, setResourcesNeeded] = useState<string[]>([]);
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([]);
  const [fundingRequired, setFundingRequired] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [colInput, setColInput] = useState("");
  const [resInput, setResInput] = useState("");
  const [eqInput, setEqInput] = useState("");

  // Step 5
  const [milestones, setMilestones] = useState<Milestone[]>([{ title: "", description: "" }]);

  const activities = mainIndustry ? (SPECIFIC_ACTIVITIES[mainIndustry] ?? []) : [];

  const addTag = (list: string[], setList: (v: string[]) => void, val: string) => {
    if (val.trim() && !list.includes(val.trim())) setList([...list, val.trim()]);
  };
  const removeTag = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.filter(v => v !== val));

  const canNext = () => {
    if (step === 1) return title.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    const mls = milestones.filter(m => m.title.trim());
    createVenture.mutate({
      data: {
        title, description: description || undefined,
        problem: problem || undefined,
        ventureType: ventureType || undefined,
        estimatedDuration: estimatedDuration || undefined,
        visibility,
        mainIndustry: mainIndustry || undefined,
        subIndustry: subIndustry || undefined,
        activityTag: activityTag || undefined,
        valueChainStage: valueChainStage || undefined,
        country: country || undefined,
        stateCity: stateCity || undefined,
        localArea: localArea || undefined,
        collaboratorsNeeded: collaboratorsNeeded.length > 0 ? collaboratorsNeeded : undefined,
        resourcesNeeded: resourcesNeeded.length > 0 ? resourcesNeeded : undefined,
        equipmentNeeded: equipmentNeeded.length > 0 ? equipmentNeeded : undefined,
        fundingRequired: fundingRequired || undefined,
        expectedOutput: expectedOutput || undefined,
        milestones: mls.length > 0 ? mls : undefined,
      } as any,
    }, {
      onSuccess: (venture) => {
        queryClient.invalidateQueries({ queryKey: getListVenturesQueryKey() });
        toast({ description: "Venture created!" });
        navigate(`/ventures/${venture.id}`);
      },
      onError: () => toast({ variant: "destructive", description: "Failed to create venture." }),
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/ventures")} className="p-1.5 rounded-full hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl">Start a Venture</h1>
          <p className="text-sm text-muted-foreground">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map(s => (
          <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors ${s.id <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* Step content */}
      <div className="space-y-5">
        {step === 1 && (
          <>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Step 1 — Venture Basics</p>
              <h2 className="font-display font-bold text-lg mb-4">What are you building?</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Venture title *</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cassava Starch Processing Plant"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What are you building or doing?</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the venture — what it produces, how it works, who benefits..."
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Problem it solves</label>
                <Textarea
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  placeholder="What challenge or gap does this venture address?"
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Venture type</label>
                  <Select value={ventureType} onValueChange={setVentureType}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Type..." /></SelectTrigger>
                    <SelectContent>
                      {VENTURE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Est. duration</label>
                  <Select value={estimatedDuration} onValueChange={setEstimatedDuration}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Duration..." /></SelectTrigger>
                    <SelectContent>
                      {["30 days","60 days","90 days","6 months","1 year","2+ years","Ongoing"].map(d =>
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visibility</label>
                <div className="flex gap-2 mt-1">
                  {(["public", "private"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${visibility === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Step 2 — Industry Classification</p>
              <h2 className="font-display font-bold text-lg mb-4">Industrial stamps</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry sector</label>
                <Select value={mainIndustry} onValueChange={v => { setMainIndustry(v); setSubIndustry(""); setActivityTag(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select sector..." /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {activities.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Specific activity</label>
                  <Select value={activityTag} onValueChange={setActivityTag}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select activity..." /></SelectTrigger>
                    <SelectContent>
                      {activities.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sub-industry / niche (optional)</label>
                <Input
                  value={subIndustry}
                  onChange={e => setSubIndustry(e.target.value)}
                  placeholder="e.g. Organic rice, Solar irrigation..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value chain stage</label>
                <Select value={valueChainStage} onValueChange={setValueChainStage}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Where in the chain?" /></SelectTrigger>
                  <SelectContent>
                    {VALUE_CHAIN_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Step 3 — Location</p>
              <h2 className="font-display font-bold text-lg mb-4">Where is this venture based?</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select country..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__african" disabled className="text-xs font-bold text-muted-foreground">— African Countries —</SelectItem>
                    {AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">State / City</label>
                <Input value={stateCity} onChange={e => setStateCity(e.target.value)} placeholder="e.g. Lagos, Ogun State..." className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Local area (optional)</label>
                <Input value={localArea} onChange={e => setLocalArea(e.target.value)} placeholder="e.g. Aba, Agbara Industrial Zone..." className="mt-1" />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Step 4 — Resources & Output</p>
              <h2 className="font-display font-bold text-lg mb-4">What do you need?</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Collaborators needed</label>
                <div className="flex gap-2 mt-1">
                  <Input value={colInput} onChange={e => setColInput(e.target.value)} placeholder="e.g. Agronomist, Welder..." onKeyDown={e => { if (e.key === "Enter") { addTag(collaboratorsNeeded, setCollaboratorsNeeded, colInput); setColInput(""); } }} />
                  <Button size="sm" variant="outline" onClick={() => { addTag(collaboratorsNeeded, setCollaboratorsNeeded, colInput); setColInput(""); }}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {collaboratorsNeeded.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t} <button onClick={() => removeTag(collaboratorsNeeded, setCollaboratorsNeeded, t)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Raw materials / resources needed</label>
                <div className="flex gap-2 mt-1">
                  <Input value={resInput} onChange={e => setResInput(e.target.value)} placeholder="e.g. Cassava roots, Solar panels..." onKeyDown={e => { if (e.key === "Enter") { addTag(resourcesNeeded, setResourcesNeeded, resInput); setResInput(""); } }} />
                  <Button size="sm" variant="outline" onClick={() => { addTag(resourcesNeeded, setResourcesNeeded, resInput); setResInput(""); }}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {resourcesNeeded.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t} <button onClick={() => removeTag(resourcesNeeded, setResourcesNeeded, t)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Equipment needed</label>
                <div className="flex gap-2 mt-1">
                  <Input value={eqInput} onChange={e => setEqInput(e.target.value)} placeholder="e.g. Starch extractor, Generator..." onKeyDown={e => { if (e.key === "Enter") { addTag(equipmentNeeded, setEquipmentNeeded, eqInput); setEqInput(""); } }} />
                  <Button size="sm" variant="outline" onClick={() => { addTag(equipmentNeeded, setEquipmentNeeded, eqInput); setEqInput(""); }}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {equipmentNeeded.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t} <button onClick={() => removeTag(equipmentNeeded, setEquipmentNeeded, t)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Funding required</label>
                  <Input value={fundingRequired} onChange={e => setFundingRequired(e.target.value)} placeholder="e.g. ₦500,000" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected output</label>
                  <Input value={expectedOutput} onChange={e => setExpectedOutput(e.target.value)} placeholder="e.g. 2 tons/month" className="mt-1" />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Step 5 — Milestones</p>
              <h2 className="font-display font-bold text-lg mb-4">Key milestones</h2>
            </div>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Milestone {i + 1}</span>
                    {milestones.length > 1 && (
                      <button onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={m.title}
                    onChange={e => setMilestones(milestones.map((ml, j) => j === i ? { ...ml, title: e.target.value } : ml))}
                    placeholder="e.g. Land secured and prepared"
                  />
                  <Input
                    value={m.description}
                    onChange={e => setMilestones(milestones.map((ml, j) => j === i ? { ...ml, description: e.target.value } : ml))}
                    placeholder="Brief description (optional)"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMilestones([...milestones, { title: "", description: "" }])}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add milestone
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}
        {step < STEPS.length ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createVenture.isPending || !title.trim()}
            className="gap-2"
          >
            {createVenture.isPending ? "Creating..." : (
              <><Check className="h-4 w-4" /> Launch Venture</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
