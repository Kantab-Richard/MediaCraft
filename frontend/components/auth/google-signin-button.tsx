"use client";

import { api } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import { extractErrorMessage } from "@/lib/utils";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            ux_mode?: "popup" | "redirect";
            context?: "signin" | "signup" | "use";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
            }
          ) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

type GoogleSigninButtonProps = {
  next: string;
  mode: "login" | "register";
};

export function GoogleSigninButton({
  next,
  mode,
}: GoogleSigninButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!scriptReady || !buttonRef.current || !window.google || !clientId) {
      return;
    }

    buttonRef.current.innerHTML = "";
    const buttonWidth = Math.min(buttonRef.current.clientWidth || 320, 380);

    window.google.accounts.id.initialize({
      client_id: clientId,
      context: mode === "register" ? "signup" : "signin",
      callback: async ({ credential }) => {
        setGoogleLoading(true);

        try {
          const result = await api.googleLogin(credential);
          setAuthSession(result);
          toast.success("Signed in with Google");
          const redirectTarget =
            next !== "/" ? next : result.user.isAdmin ? "/admin" : "/";
          router.push(redirectTarget);
          router.refresh();
        } catch (error) {
          toast.error(extractErrorMessage(error));
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: mode === "register" ? "signup_with" : "signin_with",
      width: buttonWidth,
    });
  }, [mode, next, router, scriptReady]);

  const clientIdMissing = !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="space-y-3">
        <div
          ref={buttonRef}
          className="flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background"
        />
        {!clientIdMissing && !scriptReady && (
          <p className="text-center text-xs text-muted-foreground">
            Loading Google sign-in...
          </p>
        )}
        {googleLoading && (
          <p className="text-center text-xs text-muted-foreground">
            Completing Google sign-in...
          </p>
        )}
        {clientIdMissing && (
          <p className="text-center text-xs text-red-500">
            Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to enable Google sign-in.
          </p>
        )}
      </div>
    </>
  );
}
