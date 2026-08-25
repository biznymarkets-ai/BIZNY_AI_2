import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, UserCheck } from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import BiznyLogo from "@/components/BiznyLogo";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Please enter your email address or persona identifier." }),
});

const QUICK_PERSONAS = [
  { name: "Chidi Okafor", handle: "chidi.okafor@bizny.demo", role: "Agro-Processor" },
  { name: "Amara Eze", handle: "amara.eze@bizny.demo", role: "Machinery Fabricator" },
  { name: "Dr. Fatima", handle: "fatima.almansoor@bizny.demo", role: "Quality & Lab Auditor" },
  { name: "Emeka Nwosu", handle: "emeka.nwosu@bizny.demo", role: "Logistics Carrier" },
  { name: "Ada Adeleke", handle: "ada.adeleke@bizny.demo", role: "Retail Offtaker" },
];

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  });

  const loginMutation = useLogin();

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuthToken(data.token);
          toast({
            title: "Welcome back!",
            description: `Signed in as ${data.user?.name || "Member"}.`,
          });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: error?.message || "Invalid account credentials. Please check your email or handle.",
          });
        },
      }
    );
  }

  const handleSelectPersona = (email: string) => {
    form.setValue("email", email, { shouldValidate: true });
    onSubmit({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo + branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <BiznyLogo size="lg" showText={false} className="mb-4" />
          <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Log in to Bizny</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter your email or persona handle to access your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <GoogleAuthButton mode="login" />

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-100 w-full" />
            <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wider shrink-0">
              Or with email
            </span>
            <div className="border-t border-gray-100 w-full" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Email or persona handle</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. chidi.okafor@bizny.demo or chidi"
                        className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-primary/20 focus-visible:border-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold rounded-xl"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in…</>
                ) : (
                  "Continue to Workspace"
                )}
              </Button>
            </form>
          </Form>

          {/* Quick Persona Selectors */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Or log in directly as a verified ecosystem member:</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_PERSONAS.map((p) => (
                <button
                  key={p.handle}
                  type="button"
                  onClick={() => handleSelectPersona(p.handle)}
                  disabled={loginMutation.isPending}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs bg-gray-50 hover:bg-primary/5 hover:border-primary/30 border border-gray-200/70 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                    <div>
                      <span className="font-semibold text-gray-800 group-hover:text-primary">{p.name}</span>
                      <span className="text-gray-400 ml-1.5 font-normal">({p.role})</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono group-hover:text-primary/70">Login →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:text-primary/80">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
