import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one digit"),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { register: doRegister, isAuthenticated } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await doRegister(values.email, values.password);
      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-light/20 via-background to-background -z-10" />
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-navy flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">C</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Continuity</span>
        </Link>
        <Card className="w-full max-w-md border-border bg-card shadow-soft rounded-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif font-bold text-foreground">You&apos;re all set</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your account has been created. Sign in to continue to your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full gradient-gold text-accent-foreground shadow-gold hover:opacity-90 transition-opacity"
            >
              <Link to="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-gold-light/20 via-background to-background -z-10" />
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg gradient-navy flex items-center justify-center">
          <span className="text-sm font-bold text-primary-foreground">C</span>
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">Continuity</span>
      </Link>

      <Card className="w-full max-w-md border-border bg-card shadow-soft rounded-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-serif font-bold text-foreground">Create an account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email and a secure password to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
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
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full gradient-gold text-accent-foreground shadow-gold hover:opacity-90 transition-opacity"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
