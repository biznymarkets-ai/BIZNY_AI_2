import { useState } from "react";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Building2, User, Globe, Target, Briefcase } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import IndustryStampSelector from "@/components/IndustryStampSelector";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import BiznyLogo from "@/components/BiznyLogo";

const ROLES = [
  "Student",
  "Artisan / Craftsperson",
  "Farmer / Agribusiness",
  "Trader / Merchant",
  "Producer / Manufacturer",
  "Processor / Value-Adder",
  "Logistics Provider",
  "Engineer / Technician",
  "Professional / Consultant",
  "Founder / Entrepreneur",
  "Investor / Funder",
  "Researcher / Analyst",
  "Field Agent",
  "Industrial Enthusiast",
  "Other",
];

const SPECIFIC_INDUSTRIES = [
  "Crop Farming", "Livestock / Poultry", "Aquaculture / Fisheries", "Agro-Processing", "Food Manufacturing", "Cold Chain & Storage",
  "Solar Energy", "Biomass / Biofuels", "Mini-Grid / Off-Grid Power", "Water Treatment",
  "Textile & Apparel", "Furniture & Woodwork", "Metal Fabrication", "Plastics & Packaging", "Chemicals & Cosmetics", "Cement & Construction Materials",
  "Road Freight & Transport", "Last-Mile Delivery", "Export & Import", "Warehousing",
  "Software & Apps", "Electronics & Hardware", "Telecoms & Networks",
  "Civil Construction", "Real Estate", "Housing Development",
  "Fashion & Design", "Media & Film", "Music & Entertainment", "Arts & Crafts",
  "Healthcare & Pharma", "Education & Training", "Financial Services", "Retail", "Tourism & Hospitality",
  "Mining & Quarrying", "Forestry & Timber", "Other",
];

const AFRICAN_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Ethiopia", "Tanzania", "Uganda",
  "Senegal", "Ivory Coast", "Cameroon", "Rwanda", "Zambia", "Zimbabwe", "Mozambique",
  "Angola", "DRC", "Egypt", "Morocco", "Algeria", "Tunisia", "Other",
];

const GOALS = [
  { id: "find_opportunities", label: "Discover funding & partnership opportunities" },
  { id: "start_venture", label: "Start or grow a business venture" },
  { id: "find_collaborators", label: "Find skilled collaborators and partners" },
  { id: "use_templates", label: "Use venture templates & blueprints" },
  { id: "track_progress", label: "Track and document my venture progress" },
  { id: "verify_identity", label: "Get verified as a Field Agent or professional" },
  { id: "market_products", label: "List and market my business on the Marketplace" },
  { id: "industrial_learning", label: "Learn about African industries and opportunities" },
  { id: "connect_ecosystem", label: "Connect with Africa's industrial ecosystem" },
];

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Phone number is required"),
  whatsapp: z.string().optional(),
  country: z.string().min(2, "Select your country"),
  stateCity: z.string().optional(),
  cityLga: z.string().optional(),
  role: z.string().min(2, "Select your role"),
  skillsText: z.string().optional(),
  businessName: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  website: z.string().optional(),
  yearsExperience: z.string().optional(),
  primaryProducts: z.string().optional(),
});

const inputClass = "h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-primary/20 focus-visible:border-primary/50";
const labelClass = "text-sm font-medium text-gray-700";

const STEPS = [
  { label: "Identity", icon: User },
  { label: "Role", icon: Briefcase },
  { label: "Industry", icon: Globe },
  { label: "Business", icon: Building2 },
  { label: "Goals", icon: Target },
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
  const [_, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "", email: "", phone: "", whatsapp: "", country: "", stateCity: "", cityLga: "",
      role: "", skillsText: "", businessName: "", businessRegistrationNumber: "",
      website: "", yearsExperience: "", primaryProducts: "",
    },
  });

  const registerMutation = useRegister();

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    const skills = values.skillsText ? values.skillsText.split(",").map(s => s.trim()).filter(Boolean) : [];
    const industry = selectedIndustries.length > 0 ? selectedIndustries[0] : "Other";
    const whatsapp = whatsappSameAsPhone ? values.phone : (values.whatsapp || values.phone);

    registerMutation.mutate(
      {
        data: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          whatsapp,
          country: values.country,
          stateCity: values.stateCity,
          cityLga: values.cityLga,
          industry,
          role: values.role,
          skills,
          interests: selectedIndustries,
          goals: selectedGoals,
          businessName: values.businessName || undefined,
          businessRegistrationNumber: values.businessRegistrationNumber || undefined,
          website: values.website || undefined,
          yearsExperience: values.yearsExperience ? parseInt(values.yearsExperience) : undefined,
        },
      },
      {
        onSuccess: (data) => {
          setAuthToken(data.token);
          toast({ title: "Welcome to Bizny!", description: "Your account has been created." });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({ variant: "destructive", description: error.message || "Registration failed. Please try again." });
        },
      }
    );
  }

  async function nextStep() {
    let valid = false;
    if (step === 1) {
      valid = await form.trigger(["name", "email", "phone", "country"]);
    } else if (step === 2) {
      valid = await form.trigger(["role"]);
      if (!form.getValues("role")) {
        toast({ title: "Select your role to continue", variant: "destructive" });
        valid = false;
      }
    } else if (step === 3) {
      if (selectedIndustries.length === 0) {
        toast({ title: "Select at least one industry", variant: "destructive" });
        valid = false;
      } else {
        valid = true;
      }
    } else {
      valid = true;
    }
    if (valid) setStep(s => s + 1);
  }

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : prev.length < 5 ? [...prev, industry] : prev
    );
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20 flex flex-col">
      {/* Header */}
      <div className="py-5 px-6 border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <BiznyLogo size="md" />
            </div>
          </Link>
          <div className="text-sm text-gray-500">
            Have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-lg">

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((s, i) => {
                const num = i + 1;
                const Icon = s.icon;
                const isActive = step === num;
                const isDone = step > num;
                return (
                  <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isDone ? "bg-primary border-primary text-white" :
                      isActive ? "bg-white border-primary text-primary shadow-md" :
                      "bg-white border-gray-200 text-gray-400"
                    )}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider hidden sm:block",
                      isActive ? "text-primary" : isDone ? "text-primary/60" : "text-gray-400"
                    )}>{s.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* ── Step 1: Identity ── */}
                {step === 1 && (
                  <div className="p-7 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Create your account</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Join Bizny with Google or fill your profile below</p>
                    </div>

                    <GoogleAuthButton mode="signup" />

                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-gray-100 w-full" />
                      <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wider shrink-0">
                        Or enter details manually
                      </span>
                      <div className="border-t border-gray-100 w-full" />
                    </div>

                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Full Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Amina Okafor" className={inputClass} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="amina@example.com" className={inputClass} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+234 801 234 5678" className={inputClass} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer"
                      onClick={() => setWhatsappSameAsPhone(p => !p)}>
                      <div className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        whatsappSameAsPhone ? "bg-primary border-primary" : "border-gray-300"
                      )}>
                        {whatsappSameAsPhone && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">WhatsApp is same as phone number</span>
                    </div>

                    {!whatsappSameAsPhone && (
                      <FormField control={form.control} name="whatsapp" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>WhatsApp Number</FormLabel>
                          <FormControl><Input placeholder="+234 801 234 5678" className={inputClass} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <FormField control={form.control} name="country" render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Country</FormLabel>
                            <FormControl>
                              <select
                                className={cn(inputClass, "w-full rounded-md border px-3 text-sm")}
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">Select…</option>
                                {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="stateCity" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>State / Province</FormLabel>
                          <FormControl><Input placeholder="e.g. Lagos" className={inputClass} {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="cityLga" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>City / LGA</FormLabel>
                          <FormControl><Input placeholder="e.g. Ikeja" className={inputClass} {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* ── Step 2: Role ── */}
                {step === 2 && (
                  <div className="p-7 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">What is your role?</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Pick the one that best describes you</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.map((role) => {
                        const selected = form.watch("role") === role;
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => form.setValue("role", role, { shouldValidate: true })}
                            className={cn(
                              "px-3.5 py-2.5 rounded-xl border text-sm font-medium text-left transition-all duration-150",
                              selected
                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100/80"
                            )}
                          >
                            {selected && <span className="mr-1.5 text-primary">✓</span>}{role}
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.errors.role && (
                      <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
                    )}
                    <FormField control={form.control} name="skillsText" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Your Key Skills <span className="text-gray-400 font-normal">(optional, comma-separated)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. welding, solar installation, bookkeeping" className={inputClass} {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* ── Step 3: Industry ── */}
                {step === 3 && (
                  <div className="p-7 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Your Industry Stamps</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Select your specific activities — Sector → Sub-sector → Stamp</p>
                    </div>
                    <IndustryStampSelector
                      selected={selectedIndustries}
                      onChange={setSelectedIndustries}
                      max={5}
                    />
                  </div>
                )}

                {/* ── Step 4: Business Profile (optional) ── */}
                {step === 4 && (
                  <div className="p-7 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Business Profile</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Optional — skip if you're not registering a business</p>
                    </div>
                    <FormField control={form.control} name="businessName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Business / Organization Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Suntech Solar Ltd" className={inputClass} {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="businessRegistrationNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Registration Number <span className="text-gray-400 font-normal">(CAC / BRELA / etc.)</span></FormLabel>
                        <FormControl><Input placeholder="RC 1234567" className={inputClass} {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Years in Operation</FormLabel>
                          <FormControl><Input type="number" min="0" max="100" placeholder="3" className={inputClass} {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="website" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Website <span className="text-gray-400 font-normal">(opt)</span></FormLabel>
                          <FormControl><Input placeholder="https://..." className={inputClass} {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="primaryProducts" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Products / Services <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe what your business offers..."
                            className="bg-gray-50 border-gray-200 text-gray-900 min-h-[80px] resize-none focus-visible:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                      <p className="text-xs text-teal-700 font-medium leading-relaxed">
                        Businesses with complete profiles get 3× more visibility on the Marketplace and priority consideration for Field Agent verification.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Step 5: Goals ── */}
                {step === 5 && (
                  <div className="p-7 space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">What brings you to Bizny?</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Select all that apply — we'll personalise your feed</p>
                    </div>
                    <div className="space-y-2.5">
                      {GOALS.map((goal) => {
                        const selected = selectedGoals.includes(goal.id);
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => toggleGoal(goal.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150",
                              selected
                                ? "bg-primary/5 border-primary"
                                : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50"
                            )}
                          >
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                              selected ? "border-primary bg-primary" : "border-gray-300 bg-white"
                            )}>
                              {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className={cn("text-sm font-medium", selected ? "text-primary" : "text-gray-700")}>
                              {goal.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Footer ── */}
                <div className="px-7 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2 border-gray-200 text-gray-700">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  ) : <div />}

                  {step < 5 ? (
                    <Button type="button" onClick={nextStep} className="gap-2 bg-primary hover:bg-primary/90 text-white px-6">
                      {step === 4 ? "Skip / Continue" : "Continue"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="gap-2 bg-primary hover:bg-primary/90 text-white px-8"
                    >
                      {registerMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Join Bizny</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>

          <p className="text-center text-xs text-gray-400 mt-6">
            By joining, you agree to Bizny's{" "}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>{" "}
            and{" "}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
