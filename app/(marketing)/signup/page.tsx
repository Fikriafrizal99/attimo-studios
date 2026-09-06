"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandMark } from "@/components/BrandMark";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error: err } = await authClient.signUp.email({
      email: normalizedEmail,
      password,
      name: name.trim() || "Guest",
      callbackURL: "/dashboard",
    });
    setLoading(false);
    if (err) {
      const msg = err.message ?? "Sign up failed";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (data) {
      toast.success("Account created.");
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0E0E10] px-4 py-8 text-neutral-200">
      <div className="flex justify-center">
        <BrandMark showTagline />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md border border-white/10 bg-neutral-900/80 text-neutral-100 backdrop-blur-sm shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
          <CardHeader className="space-y-3">
            <CardTitle className="font-serif text-3xl tracking-tight text-neutral-50">
              Create your Endriya account.
            </CardTitle>
            <CardDescription className="text-sm text-neutral-300">
              Build and manage complete digital wedding experiences from one studio.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <p
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  className="border border-white/10 bg-transparent text-neutral-100 placeholder:text-neutral-500 transition-[border-color,box-shadow,background-color] duration-250 ease-out focus-visible:border-[#BFA14A] focus-visible:bg-white/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="border border-white/10 bg-transparent text-neutral-100 placeholder:text-neutral-500 transition-[border-color,box-shadow,background-color] duration-250 ease-out focus-visible:border-[#BFA14A] focus-visible:bg-white/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="border border-white/10 bg-transparent text-neutral-100 placeholder:text-neutral-500 transition-[border-color,box-shadow,background-color] duration-250 ease-out focus-visible:border-[#BFA14A] focus-visible:bg-white/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-neutral-100 text-[#0E0E10] transition-colors duration-250 ease-out hover:bg-neutral-200 disabled:opacity-70 disabled:hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>
              <p className="text-center text-xs text-neutral-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="underline-offset-4 transition-colors duration-250 ease-out hover:text-neutral-300 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
