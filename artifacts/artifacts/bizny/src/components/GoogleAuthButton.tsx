import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/firebaseAuth";
import { Loader2, ExternalLink, Copy, Check, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface GoogleAuthButtonProps {
  mode?: "login" | "signup";
  className?: string;
  onSuccess?: (user: any, isNewUser: boolean) => void;
}

export default function GoogleAuthButton({
  mode = "login",
  className = "",
  onSuccess,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quickEmail, setQuickEmail] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [_, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "";

  const handleGoogleClick = async () => {
    setIsLoading(true);
    try {
      const data = await signInWithGoogle();
      setAuthToken(data.token);
      toast({
        title: data.isNewUser ? "Welcome to Bizny!" : "Welcome back!",
        description: `Signed in as ${data.user?.name || data.user?.email}.`,
      });
      if (onSuccess) {
        onSuccess(data.user, data.isNewUser);
      } else {
        setLocation("/dashboard");
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err?.message?.includes("Domain unauthorized in Firebase Auth") || err?.code === "auth/unauthorized-domain") {
        setShowDomainModal(true);
      } else {
        toast({
          variant: "destructive",
          title: "Google Sign-In",
          description: err?.message || "Could not complete Google authentication. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyDomain = () => {
    if (navigator?.clipboard && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Domain Copied",
        description: `${currentHostname} copied to clipboard.`,
      });
    }
  };

  const handleQuickContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail || !quickEmail.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setQuickLoading(true);
    try {
      // First try login with email
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: quickEmail.trim().toLowerCase() }),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        setAuthToken(data.token);
        setShowDomainModal(false);
        toast({
          title: "Signed In Successfully",
          description: `Welcome back to Bizny!`,
        });
        setLocation("/dashboard");
        return;
      }

      // If user doesn't exist, create a fast registration
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: quickEmail.trim().toLowerCase(),
          name: quickName.trim() || quickEmail.split("@")[0],
          country: "Nigeria",
          role: "Founder / Entrepreneur",
          industry: "AgriTech",
        }),
      });

      if (regRes.ok) {
        const data = await regRes.json();
        setAuthToken(data.token);
        setShowDomainModal(false);
        toast({
          title: "Account Created!",
          description: `Welcome to Bizny, ${data.user?.name || "Entrepreneur"}!`,
        });
        setLocation("/dashboard");
      } else {
        const errData = await regRes.json().catch(() => ({}));
        throw new Error(errData.error || "Could not complete registration.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sign In Error",
        description: err?.message || "Please use the manual registration form on the page.",
      });
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleClick}
        disabled={isLoading}
        className={`w-full h-11 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-3 transition-colors ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{isLoading ? "Connecting to Google..." : mode === "signup" ? "Sign up with Google" : "Sign in with Google"}</span>
      </Button>

      <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 border-0 shadow-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Google Sign-In: Firebase Domain Setup
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 leading-relaxed">
              Firebase Authentication requires preview & custom hosting domains to be registered in Authorized Domains.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Domain Copy Box */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Your App Domain</span>
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0971401176/authentication/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-800 select-all truncate">
                  {currentHostname}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyDomain}
                  className="h-8 px-2.5 text-xs flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Quick 1-Step Alternative */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-gray-900">Instant Direct Access</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Enter your email below to instantly create or access your Bizny workspace without waiting for domain authorization.
              </p>

              <form onSubmit={handleQuickContinue} className="space-y-2.5">
                {mode === "signup" && (
                  <Input
                    placeholder="Your Full Name (e.g. Amina Okafor)"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="h-10 text-sm bg-gray-50 border-gray-200"
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    required
                    className="h-10 text-sm bg-gray-50 border-gray-200"
                  />
                  <Button
                    type="submit"
                    disabled={quickLoading}
                    className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-medium shrink-0 flex items-center gap-1.5"
                  >
                    {quickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-3.5 h-3.5" /></>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

