import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import BiznyLogo from "@/components/BiznyLogo";

export default function AuthCallback() {
  const [_, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function handleAuth() {
      try {
        const sb = getSupabase();
        if (!sb) {
          throw new Error("Supabase client is not configured.");
        }

        // 1. Get session from URL / storage
        const { data: sessionData, error: sessionError } = await sb.auth.getSession();
        if (sessionError) throw sessionError;

        let session = sessionData.session;

        // If not immediately available, try getUser
        if (!session) {
          const { data: userData, error: userError } = await sb.auth.getUser();
          if (userError) throw userError;
          if (!userData.user) throw new Error("No authenticated user found in OAuth callback.");
        }

        const user = session?.user;
        if (!user || !user.email) {
          throw new Error("Could not retrieve user profile from Supabase.");
        }

        // 2. Exchange with Bizny Backend to create/link user record
        const res = await fetch("/api/auth/supabase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseUid: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0],
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            accessToken: session?.access_token,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to establish Bizny user session.");
        }

        const data = await res.json();
        if (mounted) {
          setAuthToken(data.token);
          setStatus("success");
          toast({
            title: data.isNewUser ? "Welcome to Bizny!" : "Welcome back!",
            description: `Signed in as ${data.user?.name || data.user?.email}`,
          });
          setTimeout(() => {
            setLocation("/dashboard");
          }, 800);
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        if (mounted) {
          setStatus("error");
          setErrorMessage(err.message || "Failed to complete authentication.");
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: err.message || "Could not complete Google Sign-In.",
          });
        }
      }
    }

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [setLocation, setAuthToken, toast]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <BiznyLogo size="lg" />
        </div>

        {status === "processing" && (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Verifying Google Session...</h2>
            <p className="text-sm text-slate-500">
              Connecting your Supabase account and setting up your workspace.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Authenticated!</h2>
            <p className="text-sm text-slate-500">Redirecting to your Bizny dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Sign-In Notice</h2>
            <p className="text-sm text-slate-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
              {errorMessage}
            </p>
            <button
              onClick={() => setLocation("/login")}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
