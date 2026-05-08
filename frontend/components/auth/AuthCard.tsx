"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { GoogleSigninButton } from "@/components/auth/google-signin-button";
import { api } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import { cn, extractErrorMessage } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

interface AuthCardProps {
  mode: "login" | "register";
}

export function AuthCard({ mode }: AuthCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => searchParams.get("next") || "/", [searchParams]);
  const isRegister = mode === "register";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = isRegister
        ? await api.signup(email, password, name)
        : await api.login(email, password);

      setAuthSession(result);
      toast.success(isRegister ? "Account created" : "Welcome back");
      const redirectTarget =
        next !== "/" ? next : result.user.isAdmin ? "/admin" : "/";
      router.push(redirectTarget);
      router.refresh();
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-8 shadow-2xl backdrop-blur">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/70">
          MediCraftAI account
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isRegister ? "Create your account" : "Login to continue"}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {isRegister
            ? "Register once to unlock downloads and keep your account connected on this device."
            : "Sign in to keep downloading with your saved account and API key."}
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        {isRegister && (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Name</span>
            <input
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            type="email"
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Password</span>
          <input
            type="password"
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary-light text-base"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRegister ? (
            "Register"
          ) : (
            "Login"
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleSigninButton next={next} mode={mode} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={`${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(next)}`}
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "h-auto px-0 text-sm font-semibold"
          )}
        >
          {isRegister ? "Login" : "Register"}
        </Link>
      </p>
    </div>
  );
}
