import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

function getTokenFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") || "";
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token] = useState(getTokenFromUrl);
  const [done, setDone] = useState(false);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const resetMutation = useMutation({
    mutationFn: async (values: ResetValues) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        token,
        password: values.password,
      });
      return res.json();
    },
    onSuccess: () => {
      setDone(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't reset password",
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
          {done ? (
            <div className="text-center" data-testid="reset-success">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h1 className="text-2xl font-bold text-slate-900">Password reset</h1>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Your password has been updated. You can now sign in with your new
                password.
              </p>
              <Button
                className="w-full"
                onClick={() => setLocation("/login")}
                data-testid="button-go-login"
              >
                Go to sign in
              </Button>
            </div>
          ) : !token ? (
            <div className="text-center" data-testid="reset-invalid">
              <h1 className="text-2xl font-bold text-slate-900">Invalid link</h1>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                This password reset link is missing or invalid. Please request a
                new one.
              </p>
              <Button
                className="w-full"
                onClick={() => setLocation("/login")}
                data-testid="button-back-login"
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-slate-900">
                Choose a new password
              </h1>
              <p className="text-center text-sm text-slate-500 mt-1 mb-6">
                Enter a new password for your account
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((v) => resetMutation.mutate(v))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            data-testid="input-new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Re-enter your password"
                            data-testid="input-confirm-password"
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
                    disabled={resetMutation.isPending}
                    data-testid="button-submit-reset"
                  >
                    {resetMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reset password
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
