import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import logoUrl from "@assets/foulpay-logo.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "Please enter your name").max(50),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

export default function Login() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", email: "", password: "" },
  });

  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    setLocation("/");
  };

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const res = await apiRequest("POST", "/api/login", values);
      return res.json();
    },
    onSuccess,
    onError: (error: Error) => {
      toast({
        title: "Couldn't sign in",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterValues) => {
      const res = await apiRequest("POST", "/api/register", values);
      return res.json();
    },
    onSuccess,
    onError: (error: Error) => {
      toast({
        title: "Couldn't create account",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const forgotMutation = useMutation({
    mutationFn: async (values: ForgotValues) => {
      const res = await apiRequest("POST", "/api/forgot-password", values);
      return res.json();
    },
    onSuccess: (data: { message?: string }) => {
      toast({
        title: "Check your email",
        description:
          data?.message ||
          "If an account exists for that email, we've sent a link to reset your password.",
      });
      forgotForm.reset();
      setMode("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Something went wrong",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <button
        onClick={() => setLocation("/")}
        className="mb-6"
        data-testid="link-home"
        aria-label="Go to home"
      >
        <img src={logoUrl} alt="FoulPay" className="h-14 w-auto" />
      </button>

      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-center text-slate-900">
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
                ? "Create your account"
                : "Reset your password"}
          </h1>
          <p className="text-center text-sm text-slate-500 mt-1 mb-6">
            {mode === "login"
              ? "Sign in to manage your team fines"
              : mode === "register"
                ? "Get started with FoulPay in seconds"
                : "Enter your email and we'll send you a reset link"}
          </p>

          {mode === "forgot" ? (
            <Form {...forgotForm}>
              <form
                onSubmit={forgotForm.handleSubmit((v) => forgotMutation.mutate(v))}
                className="space-y-4"
              >
                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          data-testid="input-forgot-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotMutation.isPending}
                  data-testid="button-submit-forgot"
                >
                  {forgotMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send reset link
                </Button>
              </form>
            </Form>
          ) : mode === "login" ? (
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit((v) => loginMutation.mutate(v))}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          data-testid="input-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm font-medium text-primary hover:underline"
                    data-testid="button-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit-login"
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit((v) =>
                  registerMutation.mutate(v),
                )}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="name"
                          placeholder="Jordan Smith"
                          data-testid="input-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          data-testid="input-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit-register"
                >
                  {registerMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </form>
            </Form>
          )}

          <p className="text-center text-sm text-slate-600 mt-6">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-primary hover:underline"
                  data-testid="button-switch-register"
                >
                  Sign up
                </button>
              </>
            ) : mode === "register" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-primary hover:underline"
                  data-testid="button-switch-login"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-primary hover:underline"
                  data-testid="button-switch-login"
                >
                  Back to sign in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
