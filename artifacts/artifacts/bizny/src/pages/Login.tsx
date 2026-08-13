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
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

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
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            description: error.message || "Please check your email and try again.",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo + branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo.jpg" alt="Bizny" className="w-14 h-14 rounded-2xl mb-5 shadow-sm border border-gray-100" />
          <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Log in to Bizny</h1>
          <p className="text-gray-500 mt-2 text-sm">Enter your email to access your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Email address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
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
                  "Continue"
                )}
              </Button>
            </form>
          </Form>
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
