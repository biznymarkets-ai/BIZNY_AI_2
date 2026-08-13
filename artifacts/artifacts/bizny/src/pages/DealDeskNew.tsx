import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateDeal, getListDealsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Check, Handshake, Plus, X,
  Loader2, RefreshCw, Edit3, Send, Save, Calculator,
  FileText, ShieldCheck, AlertTriangle, Zap, TrendingUp,
} from "lucide-react";
import { AFRICAN_COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealType {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  industryTags: string[] | null;
}

interface FieldSchema {
  id: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  placeholder: string | null;
  helperText: string | null;
  options: string[] | null;
  isRequired: boolean;
  section: string;
  displayOrder: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Classification",  icon: FileText },
  { id: 2, label: "Opportunity",     icon: Zap },
  { id: 3, label: "Economics",       icon: TrendingUp },
  { id: 4, label: "Risk & Docs",     icon: ShieldCheck },
  { id: 5, label: "Calculator",      icon: Calculator },
  { id: 6, label: "Summary",         icon: Send },
];

const INDUSTRIES = [
  "Food & Beverage","Agriculture","Manufacturing","Logistics","Real Estate",
  "Energy","Technology","Retail / Commerce","Education / Training","Health",
  "Construction","Media / Creative","Finance","Other",
];

const DEAL_CATEGORIES = [
  "Revenue opportunity","Profit opportunity","Supply opportunity",
  "Distribution opportunity","Investment opportunity","Partnership opportunity",
  "Asset opportunity","Market access opportunity","Other",
];

const PRICING_MODELS = [
  "Buy and resell","Commission per unit","Revenue share","Fixed service fee",
  "Profit share","Equity / Investment","Lease / Rental","Milestone payment","Custom",
];

const PAYMENT_TERMS_OPTIONS = [
  "Pay before delivery","Deposit before delivery","Payment on delivery",
  "Weekly settlement","Monthly settlement","Milestone payment",
  "Credit terms after trust is established","Custom",
];

const PARTNER_REQUIREMENTS_LIST = [
  "Has existing customer base","Has retail/supermarket access","Has logistics capacity",
  "Has storage space","Has sales team","Has working capital","Can provide market reports",
  "Can meet monthly targets","Has required licences/certifications","Other",
];

const COMPANY_SUPPORT_LIST = [
  "Product supply","Sales training","Marketing materials","Brand support",
  "Territory support","Pricing guidance","Business coaching",
  "Logistics support","Credit terms (if approved)","Technical support","Other",
];

const REQUIRED_DOCS_LIST = [
  "CAC/business registration","Valid ID","Proof of address","Bank details",
  "Tax documents","Product certification","NAFDAC/SON licence",
  "Land documents","Insurance documents","Other",
];

const TERRITORY_TYPES = ["Exclusive","Non-exclusive","Negotiable"];
const COVERAGE_OPTIONS = ["Town/ward","LGA","State","Region","National","Custom"];
const VERIFICATION_STATUSES = [
  "Not verified","Self-declared","Field agent verification needed",
  "Documents uploaded","Verified by Bizny agent",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = async <T,>(path: string, token: string, opts?: RequestInit): Promise<T> => {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

function fmtNum(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

function parseNum(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
}

// ─── Field renderer ────────────────────────────────────────────────────────────

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FieldSchema;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  const base = "mt-1";
  const label = (
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
      {field.fieldLabel}
      {field.isRequired && <span className="text-red-500">*</span>}
    </label>
  );
  const helper = field.helperText
    ? <p className="text-[11px] text-muted-foreground mt-0.5">{field.helperText}</p>
    : null;

  if (field.fieldType === "textarea") return (
    <div>
      {label}
      <Textarea
        value={value}
        onChange={e => onChange(field.fieldKey, e.target.value)}
        placeholder={field.placeholder ?? ""}
        className={`${base} resize-none`}
        rows={3}
      />
      {helper}
    </div>
  );

  if (field.fieldType === "dropdown" && field.options?.length) return (
    <div>
      {label}
      <Select value={value} onValueChange={v => onChange(field.fieldKey, v)}>
        <SelectTrigger className={base}><SelectValue placeholder={`Select ${field.fieldLabel.toLowerCase()}...`} /></SelectTrigger>
        <SelectContent>
          {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
      {helper}
    </div>
  );

  if (field.fieldType === "currency") return (
    <div>
      {label}
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₦</span>
        <Input
          value={value}
          onChange={e => onChange(field.fieldKey, e.target.value)}
          placeholder={field.placeholder ?? "0"}
          className="pl-7"
          inputMode="numeric"
        />
      </div>
      {helper}
    </div>
  );

  if (field.fieldType === "percentage") return (
    <div>
      {label}
      <div className="relative mt-1">
        <Input
          value={value}
          onChange={e => onChange(field.fieldKey, e.target.value)}
          placeholder={field.placeholder ?? "0"}
          className="pr-8"
          inputMode="numeric"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
      </div>
      {helper}
    </div>
  );

  if (field.fieldType === "number") return (
    <div>
      {label}
      <Input
        value={value}
        onChange={e => onChange(field.fieldKey, e.target.value)}
        placeholder={field.placeholder ?? "0"}
        className={base}
        inputMode="numeric"
        type="number"
      />
      {helper}
    </div>
  );

  // default: text
  return (
    <div>
      {label}
      <Input
        value={value}
        onChange={e => onChange(field.fieldKey, e.target.value)}
        placeholder={field.placeholder ?? ""}
        className={base}
      />
      {helper}
    </div>
  );
}

// ─── Checkbox group ────────────────────────────────────────────────────────────

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
      <div className="grid grid-cols-1 gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-all",
              selected.includes(opt)
                ? "border-primary bg-primary/5 text-primary font-semibold"
                : "border-border bg-card text-foreground hover:border-primary/30"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
              selected.includes(opt) ? "bg-primary border-primary" : "border-muted-foreground/30"
            )}>
              {selected.includes(opt) && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Calculator logic ──────────────────────────────────────────────────────────

function calcDistribution(vals: Record<string, string>) {
  const supply = parseNum(vals.supply_price ?? "");
  const distSell = parseNum(vals.distributor_sell_price ?? "");
  const retail = parseNum(vals.retail_price ?? "");
  const targetIncome = parseNum(vals.target_monthly_income ?? "");
  const unitMargin = distSell - supply;
  const retailerMargin = retail - distSell;
  const unitsPerMonth = unitMargin > 0 && targetIncome > 0 ? targetIncome / unitMargin : 0;
  const unitsPerDay = unitsPerMonth / 30;
  const monthlyRevenue = unitsPerMonth * distSell;
  const monthlyProfit = targetIncome;
  const annualRevenue = monthlyRevenue * 12;
  const annualProfit = monthlyProfit * 12;
  const minWorkingCapital = unitsPerMonth * supply;
  return {
    unitMargin, retailerMargin, unitsPerMonth, unitsPerDay,
    monthlyRevenue, monthlyProfit, annualRevenue, annualProfit, minWorkingCapital,
  };
}

function calcInvestment(vals: Record<string, string>) {
  const capital = parseNum(vals.capital_required ?? "");
  const equity = parseNum(vals.equity_offered ?? "") / 100;
  const roi = parseNum(vals.expected_roi ?? "") / 100;
  const durationMonths = parseNum(vals.investment_duration?.replace(/\D/g, "") ?? "") || 12;
  const investorShare = capital * equity;
  const founderShare = capital * (1 - equity);
  const annualReturn = capital * roi;
  const paybackPeriod = roi > 0 ? 1 / roi : 0;
  return { investorShare, founderShare, annualReturn, paybackPeriod, capitalRequired: capital };
}

function calcService(vals: Record<string, string>) {
  const totalValue = parseNum(vals.financial_value ?? "");
  const deposit = totalValue * 0.3;
  const midpoint = totalValue * 0.4;
  const balance = totalValue * 0.3;
  return { totalValue, deposit, midpoint, balance };
}

function calcSupply(vals: Record<string, string>) {
  const unitPrice = parseNum(vals.unit_price ?? "");
  const qtyStr = vals.quantity_required ?? "";
  const qty = parseNum(qtyStr.replace(/[^0-9]/g, "")) || 0;
  const monthlyValue = unitPrice * qty;
  const annualValue = monthlyValue * 12;
  const minOrder = parseNum(vals.min_order_qty ?? "");
  const minOrderValue = unitPrice * minOrder;
  return { unitPrice, qty, monthlyValue, annualValue, minOrder, minOrderValue };
}

// ─── Summary generator ────────────────────────────────────────────────────────

function generateSummary(
  form: Record<string, string>,
  dealTypeSlug: string,
  dealTypeName: string,
  dynamicVals: Record<string, string>,
  economics: Record<string, string>,
  risks: string,
  partnerReqs: string[],
  country: string,
  state: string,
  city: string,
): string {
  const location = [city, state, country].filter(Boolean).join(", ") || "location not specified";
  const value = economics.gross_deal_value
    ? `₦${parseNum(economics.gross_deal_value).toLocaleString("en-NG")}`
    : form.financial_value
    ? `₦${parseNum(form.financial_value).toLocaleString("en-NG")}`
    : "";
  const duration = economics.contract_duration || "to be agreed";

  let body = "";

  if (dealTypeSlug === "distribution") {
    const prod = dynamicVals.product_name || "our product";
    const unit = dynamicVals.product_unit || "unit";
    const supply = dynamicVals.supply_price ? `₦${parseNum(dynamicVals.supply_price).toLocaleString()}` : "";
    const distSell = dynamicVals.distributor_sell_price ? `₦${parseNum(dynamicVals.distributor_sell_price).toLocaleString()}` : "";
    const retailP = dynamicVals.retail_price ? `₦${parseNum(dynamicVals.retail_price).toLocaleString()}` : "";
    const margin = supply && distSell ? `₦${(parseNum(dynamicVals.distributor_sell_price) - parseNum(dynamicVals.supply_price)).toLocaleString()}` : "";
    const targetIncome = dynamicVals.target_monthly_income ? `₦${parseNum(dynamicVals.target_monthly_income).toLocaleString()}` : "";
    const unitsMonth = (dynamicVals.target_monthly_income && dynamicVals.distributor_sell_price && dynamicVals.supply_price)
      ? Math.round(parseNum(dynamicVals.target_monthly_income) / (parseNum(dynamicVals.distributor_sell_price) - parseNum(dynamicVals.supply_price)))
      : 0;
    const unitsDay = unitsMonth ? Math.round(unitsMonth / 30) : 0;
    const territory = dynamicVals.target_territory ? ` in ${dynamicVals.target_territory}` : "";
    const exclusivity = dynamicVals.territory_exclusivity || "negotiable";

    body = `We are seeking distribution partners${territory} for our ${prod}. `;
    if (supply && distSell) body += `Partners buy at ${supply} per ${unit} and resell to retailers at ${distSell}, earning ${margin} per ${unit}. `;
    if (retailP) body += `The recommended final retail price is ${retailP} per ${unit}. `;
    if (targetIncome && unitsMonth) {
      body += `A distributor targeting ${targetIncome} monthly income will need to sell approximately ${unitsMonth.toLocaleString()} ${unit}s per month — about ${unitsDay} per day. `;
    }
    body += `Territory coverage is ${exclusivity}. `;
    const channels = dynamicVals.required_channels;
    if (channels) body += `Partners are expected to sell through: ${channels}. `;
  } else if (dealTypeSlug === "supply") {
    const prod = dynamicVals.product_service || "goods/services";
    body = `We are seeking a reliable supplier of ${prod} based in ${location}. `;
    if (dynamicVals.quantity_required) body += `Required quantity: ${dynamicVals.quantity_required}. `;
    if (dynamicVals.unit_price) body += `Target price: ₦${parseNum(dynamicVals.unit_price).toLocaleString()} per unit. `;
    if (dynamicVals.quality_standard) body += `Quality standard: ${dynamicVals.quality_standard}. `;
    if (dynamicVals.delivery_location) body += `Delivery location: ${dynamicVals.delivery_location}. `;
    if (dynamicVals.payment_schedule) body += `Payment terms: ${dynamicVals.payment_schedule}. `;
  } else if (dealTypeSlug === "investment") {
    const capital = dynamicVals.capital_required ? `₦${parseNum(dynamicVals.capital_required).toLocaleString()}` : "capital";
    const equity = dynamicVals.equity_offered ? `${dynamicVals.equity_offered}%` : "";
    body = `We are raising ${capital} to grow our ${form.industry || "business"} in ${location}. `;
    if (equity) body += `We are offering ${equity} equity to the right investor. `;
    if (dynamicVals.use_of_funds) body += `Funds will be used for: ${dynamicVals.use_of_funds}. `;
    if (dynamicVals.expected_roi) body += `Expected return on investment: ${dynamicVals.expected_roi}% per annum. `;
    if (dynamicVals.revenue_model) body += `Revenue model: ${dynamicVals.revenue_model}. `;
    if (dynamicVals.exit_strategy) body += `Exit strategy: ${dynamicVals.exit_strategy}. `;
  } else if (dealTypeSlug === "manufacturing") {
    const prod = dynamicVals.product_name || "products";
    body = `We are seeking a manufacturing partner to co-produce ${prod} at ${dynamicVals.factory_location || location}. `;
    if (dynamicVals.monthly_target) body += `Target: ${parseNum(dynamicVals.monthly_target).toLocaleString()} units per month. `;
    if (dynamicVals.partner_contribution) body += `The partner must contribute: ${dynamicVals.partner_contribution}. `;
    if (dynamicVals.company_contribution) body += `We bring: ${dynamicVals.company_contribution}. `;
    if (dynamicVals.profit_sharing) body += `Profit structure: ${dynamicVals.profit_sharing}. `;
  } else {
    // Generic for all other types
    body = `We are offering a ${dealTypeName} opportunity based in ${location}. `;
    const descParts = Object.entries(dynamicVals)
      .filter(([_, v]) => v && v.length > 3)
      .slice(0, 5)
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
    if (descParts.length) body += descParts.join(". ") + ". ";
  }

  // Partner requirements
  if (partnerReqs.length) {
    body += `\n\nIdeal partners: ${partnerReqs.join(", ")}.`;
  }

  // Risks
  if (risks) {
    body += `\n\nImportant notes: ${risks}`;
  }

  // Call to action
  body += "\n\nInterested? Reach out through Bizny Deal Desk to start a conversation.";

  const title = form.title || "Untitled Deal";
  return `${title}\n\n${body.trim()}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DealDeskNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const createDeal = useCreateDeal();

  // Navigation
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Classification
  const [title, setTitle] = useState("");
  const [dealTypeSlug, setDealTypeSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [dealCategory, setDealCategory] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [visibility, setVisibility] = useState("public");

  // Deal types loaded from API
  const [dealTypes, setDealTypes] = useState<DealType[]>([]);
  const [fieldSchemas, setFieldSchemas] = useState<FieldSchema[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(false);

  // Step 2: Dynamic fields
  const [dynamicVals, setDynamicVals] = useState<Record<string, string>>({});

  // Step 3: Economics
  const [grossValue, setGrossValue] = useState("");
  const [contractDuration, setContractDuration] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [minMonthlyUnits, setMinMonthlyUnits] = useState("");
  const [minMonthlyValue, setMinMonthlyValue] = useState("");
  const [territoryCountry, setTerritoryCountry] = useState("");
  const [territoryState, setTerritoryState] = useState("");
  const [territoryType, setTerritoryType] = useState("");
  const [coverageExpectation, setCoverageExpectation] = useState("");
  const [partnerRequirements, setPartnerRequirements] = useState<string[]>([]);
  const [companySupport, setCompanySupport] = useState<string[]>([]);
  const [keyObligations, setKeyObligations] = useState("");

  // Step 4: Risk & docs
  const [risks, setRisks] = useState("");
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState("Not verified");
  const [inspectionNeeded, setInspectionNeeded] = useState("No");
  const [fieldAgentRequired, setFieldAgentRequired] = useState("No");
  const [insuranceAvailable, setInsuranceAvailable] = useState("Not applicable");

  // Step 6: Summary
  const [summary, setSummary] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);
  const [publishMode, setPublishMode] = useState<"draft" | "publish">("draft");

  // Load deal types
  useEffect(() => {
    if (!token) return;
    API<DealType[]>("/deal-types", token).then(setDealTypes).catch(() => {});
  }, [token]);

  // Load field schemas when deal type changes
  useEffect(() => {
    if (!dealTypeSlug || !token) return;
    setSchemasLoading(true);
    API<{ dealType: DealType; fields: FieldSchema[] }>(`/deal-types/${dealTypeSlug}/fields`, token)
      .then(({ fields }) => setFieldSchemas(fields))
      .catch(() => setFieldSchemas([]))
      .finally(() => setSchemasLoading(false));
    setDynamicVals({});
  }, [dealTypeSlug, token]);

  const selectedDealType = dealTypes.find(t => t.slug === dealTypeSlug);

  const setDynamic = (key: string, val: string) => setDynamicVals(prev => ({ ...prev, [key]: val }));

  // Group fields by section for step 2
  const detailFields = fieldSchemas.filter(f => f.section === "details");
  const economicsFields = fieldSchemas.filter(f => f.section === "economics");
  const termsFields = fieldSchemas.filter(f => f.section === "terms");

  // Calculator
  const calcResults = useMemo(() => {
    if (!dealTypeSlug) return null;
    const econVals = { ...dynamicVals, financial_value: grossValue };
    if (["distribution"].includes(dealTypeSlug)) return { type: "distribution", data: calcDistribution(dynamicVals) };
    if (dealTypeSlug === "investment") return { type: "investment", data: calcInvestment(dynamicVals) };
    if (dealTypeSlug === "service") return { type: "service", data: calcService(econVals) };
    if (dealTypeSlug === "supply") return { type: "supply", data: calcSupply(dynamicVals) };
    return null;
  }, [dealTypeSlug, dynamicVals, grossValue]);

  // Validation
  const canNext = () => {
    if (step === 1) return title.trim().length > 0 && dealTypeSlug !== "";
    if (step === 2) {
      const required = fieldSchemas.filter(f => f.isRequired);
      return required.every(f => (dynamicVals[f.fieldKey] ?? "").trim().length > 0);
    }
    return true;
  };

  // Submit deal
  const handleSubmit = async (status: "draft" | "open") => {
    if (!token) return;
    setSaving(true);
    try {
      const deal = await new Promise<{ id: number }>((resolve, reject) => {
        createDeal.mutate({
          data: {
            title,
            dealType: selectedDealType?.name ?? dealTypeSlug,
            industry: industry || undefined,
            description: description || undefined,
            country: country || undefined,
            stateCity: stateRegion || undefined,
            financialValue: grossValue || undefined,
            timeline: contractDuration || undefined,
            terms: keyObligations || undefined,
            risks: risks || undefined,
            fieldAgentRequired: fieldAgentRequired === "Yes",
            // v2 extended fields
            dealCategory: dealCategory || undefined,
            visibility,
            city: city || undefined,
            stateRegion: stateRegion || undefined,
            pricingModel: pricingModel || undefined,
            paymentTerms: paymentTerms || undefined,
            verificationStatus,
            inspectionNeeded,
            insuranceAvailable,
            partnerRequirements,
            companySupport,
            requiredDocumentsV2: requiredDocs,
            details: {
              ...dynamicVals,
              minMonthlyUnits, minMonthlyValue,
              territoryCountry, territoryState, territoryType, coverageExpectation,
              grossValue, contractDuration, pricingModel, paymentTerms,
              generatedSummary: summary,
            },
          } as any,
        }, {
          onSuccess: (d: any) => resolve(d),
          onError: reject,
        });
      });

      // Save dynamic field values
      const fieldValues = fieldSchemas.map(f => ({
        fieldKey: f.fieldKey,
        fieldLabel: f.fieldLabel,
        fieldType: f.fieldType,
        value: dynamicVals[f.fieldKey] ?? "",
      })).filter(v => v.value);

      if (fieldValues.length > 0) {
        await API("/deal-field-values", token, {
          method: "POST",
          body: JSON.stringify({ dealId: deal.id, values: fieldValues }),
        });
      }

      queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
      toast({ description: status === "draft" ? "Deal saved as draft." : "Deal published!" });
      navigate(`/deal-desk/${deal.id}`);
    } catch {
      toast({ variant: "destructive", description: "Failed to save deal." });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSummary = () => {
    const txt = generateSummary(
      { title, industry, financial_value: grossValue },
      dealTypeSlug,
      selectedDealType?.name ?? "Deal",
      dynamicVals,
      { gross_deal_value: grossValue, contract_duration: contractDuration },
      risks,
      partnerRequirements,
      country,
      stateRegion,
      city,
    );
    setSummary(txt);
    setEditingSummary(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate("/deal-desk")} className="p-1.5 rounded-full hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl leading-tight">Create a Deal</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{STEPS[step - 1].label} · Step {step} of {STEPS.length}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!title.trim() || !dealTypeSlug || saving}
          onClick={() => handleSubmit("draft")}
          className="gap-1.5 text-xs h-8 px-3"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save Draft
        </Button>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => s.id < step && setStep(s.id)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              s.id < step ? "bg-primary cursor-pointer" :
              s.id === step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* ── STEP 1: Classification ── */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 1</p>
            <h2 className="font-display font-bold text-lg">What deal are you creating?</h2>
            <p className="text-sm text-muted-foreground mt-1">Start by classifying your deal. This controls everything that follows.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Deal Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder='e.g. "Milk Beverage Distribution Partners Wanted"'
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">Be specific. A clear title gets more serious responses.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Deal Type <span className="text-red-500">*</span>
              </label>
              {dealTypes.length === 0 ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading deal types…
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-1 gap-1.5">
                  {dealTypes.map(t => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => setDealTypeSlug(t.slug)}
                      className={cn(
                        "flex items-start gap-3 px-3.5 py-3 rounded-xl border text-left transition-all",
                        dealTypeSlug === t.slug
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all",
                        dealTypeSlug === t.slug ? "border-primary" : "border-muted-foreground/30"
                      )}>
                        {dealTypeSlug === t.slug && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-semibold", dealTypeSlug === t.slug ? "text-primary" : "text-foreground")}>{t.name}</p>
                        {t.description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.description}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry</label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry…" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Category</label>
                <Select value={dealCategory} onValueChange={setDealCategory}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category…" /></SelectTrigger>
                  <SelectContent>{DEAL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Short Description</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly explain what this deal is about, who it benefits, and what each party contributes…"
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Location</p>
              <div className="grid grid-cols-1 gap-2">
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue placeholder="Country…" /></SelectTrigger>
                  <SelectContent>{AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={stateRegion} onChange={e => setStateRegion(e.target.value)} placeholder="State / Region" />
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City / LGA" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Who can see this deal?</label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — anyone can view</SelectItem>
                  <SelectItem value="private">Private — only you</SelectItem>
                  <SelectItem value="invitation">Invitation only — you share the link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Opportunity Details (Dynamic) ── */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 2</p>
            <h2 className="font-display font-bold text-lg">Opportunity Details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fill in the specifics for your <span className="font-semibold text-foreground">{selectedDealType?.name ?? "deal"}</span>.
            </p>
          </div>

          {schemasLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : fieldSchemas.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No fields defined for this deal type yet. You can proceed to the next step.
            </div>
          ) : (
            <div className="space-y-5">
              {detailFields.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">About the Opportunity</p>
                  {detailFields.map(f => (
                    <DynamicField key={f.id} field={f} value={dynamicVals[f.fieldKey] ?? ""} onChange={setDynamic} />
                  ))}
                </div>
              )}

              {economicsFields.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Pricing & Economics</p>
                  {economicsFields.map(f => (
                    <DynamicField key={f.id} field={f} value={dynamicVals[f.fieldKey] ?? ""} onChange={setDynamic} />
                  ))}
                </div>
              )}

              {termsFields.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Terms & Conditions</p>
                  {termsFields.map(f => (
                    <DynamicField key={f.id} field={f} value={dynamicVals[f.fieldKey] ?? ""} onChange={setDynamic} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Deal Economics & Commercial Terms ── */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 3</p>
            <h2 className="font-display font-bold text-lg">Deal Economics & Commercial Terms</h2>
            <p className="text-sm text-muted-foreground mt-1">Define the financial structure and expectations for this deal.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estimated Gross Deal Value</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₦</span>
                  <Input value={grossValue} onChange={e => setGrossValue(e.target.value)} placeholder="12,000,000" className="pl-7" inputMode="numeric" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total expected deal value.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contract Duration</label>
                <Input value={contractDuration} onChange={e => setContractDuration(e.target.value)} placeholder="e.g. 12 months" className="mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing Model</label>
              <Select value={pricingModel} onValueChange={setPricingModel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="How is money made?" /></SelectTrigger>
                <SelectContent>{PRICING_MODELS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Terms</label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="When is payment made?" /></SelectTrigger>
                <SelectContent>{PAYMENT_TERMS_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Minimum Commitment</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Min monthly units</label>
                  <Input value={minMonthlyUnits} onChange={e => setMinMonthlyUnits(e.target.value)} placeholder="e.g. 500" className="mt-0.5" inputMode="numeric" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Min monthly order value</label>
                  <div className="relative mt-0.5">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₦</span>
                    <Input value={minMonthlyValue} onChange={e => setMinMonthlyValue(e.target.value)} placeholder="500,000" className="pl-6" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Territory / Coverage</p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={territoryType} onValueChange={setTerritoryType}>
                    <SelectTrigger><SelectValue placeholder="Territory type…" /></SelectTrigger>
                    <SelectContent>{TERRITORY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={coverageExpectation} onValueChange={setCoverageExpectation}>
                    <SelectTrigger><SelectValue placeholder="Coverage level…" /></SelectTrigger>
                    <SelectContent>{COVERAGE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={territoryCountry} onValueChange={setTerritoryCountry}>
                    <SelectTrigger><SelectValue placeholder="Country…" /></SelectTrigger>
                    <SelectContent>{AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={territoryState} onChange={e => setTerritoryState(e.target.value)} placeholder="State / Region" />
                </div>
              </div>
            </div>

            <CheckboxGroup
              label="Partner Requirements"
              options={PARTNER_REQUIREMENTS_LIST}
              selected={partnerRequirements}
              onChange={setPartnerRequirements}
            />

            <CheckboxGroup
              label="Company Support Offered"
              options={COMPANY_SUPPORT_LIST}
              selected={companySupport}
              onChange={setCompanySupport}
            />

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Obligations</label>
              <Textarea
                value={keyObligations}
                onChange={e => setKeyObligations(e.target.value)}
                placeholder="Describe what the company must provide and what the partner must do…"
                className="mt-1 resize-none"
                rows={3}
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">Be clear about responsibilities on both sides.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Risk, Verification & Due Diligence ── */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 4</p>
            <h2 className="font-display font-bold text-lg">Risk, Verification & Due Diligence</h2>
            <p className="text-sm text-muted-foreground mt-1">Be transparent about risks and what verification is needed.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Known Risks & Constraints</label>
              <Textarea
                value={risks}
                onChange={e => setRisks(e.target.value)}
                placeholder="e.g. Demand uncertainty, logistics cost, spoilage risk, production capacity, delayed payments, regulatory risk…"
                className="mt-1 resize-none"
                rows={4}
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">Declaring risks builds trust. Serious partners expect transparency.</p>
            </div>

            <CheckboxGroup
              label="Required Documents from Partner"
              options={REQUIRED_DOCS_LIST}
              selected={requiredDocs}
              onChange={setRequiredDocs}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Verification Status</label>
                <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inspection Needed?</label>
                <Select value={inspectionNeeded} onValueChange={setInspectionNeeded}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Maybe">Maybe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Field Agent Required?</label>
                <Select value={fieldAgentRequired} onValueChange={setFieldAgentRequired}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Insurance Available?</label>
                <Select value={insuranceAvailable} onValueChange={setInsuranceAvailable}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Not applicable">Not applicable</SelectItem>
                    <SelectItem value="To be discussed">To be discussed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: Deal Success Calculator ── */}
      {step === 5 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 5</p>
            <h2 className="font-display font-bold text-lg">Deal Success Calculator</h2>
            <p className="text-sm text-muted-foreground mt-1">Based on the numbers you've entered, here's what this deal looks like commercially.</p>
          </div>

          {!calcResults ? (
            <div className="py-8 text-center space-y-3">
              <Calculator className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {dealTypeSlug
                  ? "Add pricing numbers in Step 2 to see calculations here."
                  : "No calculator available for this deal type — proceed to the summary."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Distribution / Supply deal calculator */}
              {calcResults.type === "distribution" && (() => {
                const d = calcResults.data as ReturnType<typeof calcDistribution>;
                return (
                  <>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Per-Unit Economics</p>
                      <div className="grid grid-cols-2 gap-3">
                        <CalcCard label="Distributor margin / unit" value={fmtNum(d.unitMargin)} highlight={d.unitMargin > 0} />
                        <CalcCard label="Retailer margin / unit" value={fmtNum(d.retailerMargin)} highlight={d.retailerMargin > 0} />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Volume Needed to Hit Target</p>
                      <div className="grid grid-cols-3 gap-3">
                        <CalcCard label="Per month" value={d.unitsPerMonth > 0 ? Math.round(d.unitsPerMonth).toLocaleString() : "—"} unit="units" />
                        <CalcCard label="Per day" value={d.unitsPerDay > 0 ? Math.round(d.unitsPerDay).toLocaleString() : "—"} unit="units" />
                        <CalcCard label="Per year" value={d.unitsPerMonth > 0 ? Math.round(d.unitsPerMonth * 12).toLocaleString() : "—"} unit="units" />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Revenue & Profit Projection</p>
                      <div className="grid grid-cols-2 gap-3">
                        <CalcCard label="Monthly revenue" value={fmtNum(d.monthlyRevenue)} />
                        <CalcCard label="Monthly profit" value={fmtNum(d.monthlyProfit)} highlight />
                        <CalcCard label="Annual revenue" value={fmtNum(d.annualRevenue)} />
                        <CalcCard label="Annual profit" value={fmtNum(d.annualProfit)} highlight />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2">Minimum Working Capital Needed</p>
                      <p className="text-2xl font-bold font-display text-amber-700 dark:text-amber-300">{fmtNum(d.minWorkingCapital)}</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">Capital needed to buy stock before selling. Based on monthly volume × supply price.</p>
                    </div>
                  </>
                );
              })()}

              {/* Investment deal calculator */}
              {calcResults.type === "investment" && (() => {
                const d = calcResults.data as ReturnType<typeof calcInvestment>;
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Investment Structure</p>
                      <div className="grid grid-cols-2 gap-3">
                        <CalcCard label="Capital required" value={fmtNum(d.capitalRequired)} />
                        <CalcCard label="Investor's share value" value={fmtNum(d.investorShare)} highlight />
                        <CalcCard label="Founder's share value" value={fmtNum(d.founderShare)} />
                        <CalcCard label="Expected annual return" value={fmtNum(d.annualReturn)} highlight />
                      </div>
                    </div>
                    {d.paybackPeriod > 0 && (
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Payback Period</p>
                        <p className="text-2xl font-bold font-display text-foreground">{d.paybackPeriod.toFixed(1)} years</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Estimated time to recover the full investment at the stated ROI.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Service contract calculator */}
              {calcResults.type === "service" && (() => {
                const d = calcResults.data as ReturnType<typeof calcService>;
                return (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Payment Schedule Breakdown</p>
                    <p className="text-[11px] text-muted-foreground">Based on a standard 30/40/30 payment structure.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <CalcCard label="Total project value" value={fmtNum(d.totalValue)} highlight />
                      <CalcCard label="Upfront deposit (30%)" value={fmtNum(d.deposit)} />
                      <CalcCard label="Mid-project (40%)" value={fmtNum(d.midpoint)} />
                      <CalcCard label="On completion (30%)" value={fmtNum(d.balance)} />
                    </div>
                  </div>
                );
              })()}

              {/* Supply deal calculator */}
              {calcResults.type === "supply" && (() => {
                const d = calcResults.data as ReturnType<typeof calcSupply>;
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Supply Contract Value</p>
                      <div className="grid grid-cols-2 gap-3">
                        <CalcCard label="Unit price" value={fmtNum(d.unitPrice)} />
                        <CalcCard label="Monthly contract value" value={fmtNum(d.monthlyValue)} highlight />
                        <CalcCard label="Annual contract value" value={fmtNum(d.annualValue)} highlight />
                        <CalcCard label="Min order value" value={fmtNum(d.minOrderValue)} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                  These are estimates based on the numbers you entered. Actual results depend on market conditions, execution quality, and external factors.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 6: Auto-Generated Deal Summary ── */}
      {step === 6 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Step 6</p>
            <h2 className="font-display font-bold text-lg">Deal Summary</h2>
            <p className="text-sm text-muted-foreground mt-1">Generate a clear, partner-facing summary of your deal. You can edit it before publishing.</p>
          </div>

          {!summary ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Ready to generate your deal summary</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  We'll write a clear, professional summary based on everything you've filled in. You can edit it after.
                </p>
              </div>
              <Button onClick={handleGenerateSummary} className="bg-primary text-white gap-2 h-11 px-6 rounded-xl">
                <Zap className="w-4 h-4" /> Generate Summary
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {editingSummary ? (
                <div>
                  <Textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    className="min-h-[280px] resize-none text-sm leading-relaxed font-medium rounded-xl"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => setEditingSummary(false)} variant="outline" className="mt-2 gap-1.5 h-8">
                    <Check className="w-3 h-3" /> Done editing
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border bg-card">
                  <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">{summary}</pre>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleGenerateSummary} className="gap-1.5 h-9">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingSummary(true)} className="gap-1.5 h-9">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Summary
                </Button>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Publish or save</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit("draft")}
                    disabled={saving}
                    className="h-12 rounded-xl gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit("open")}
                    disabled={saving}
                    className="h-12 rounded-xl bg-primary text-white gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Publish Deal
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Publishing makes this deal visible to potential partners on Bizny Deal Desk.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nav buttons ── */}
      {step < 6 && (
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : <div />}
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="gap-1 bg-primary text-white"
          >
            {step === 5 ? "Next: Summary" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Calc card component ───────────────────────────────────────────────────────

function CalcCard({ label, value, highlight, unit }: {
  label: string; value: string; highlight?: boolean; unit?: string;
}) {
  return (
    <div className={cn(
      "p-3 rounded-xl border",
      highlight ? "bg-primary/5 border-primary/20" : "bg-card border-border"
    )}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight mb-1">{label}</p>
      <p className={cn("text-lg font-bold font-display leading-none", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </p>
      {unit && <p className="text-[10px] text-muted-foreground mt-0.5">{unit}</p>}
    </div>
  );
}
