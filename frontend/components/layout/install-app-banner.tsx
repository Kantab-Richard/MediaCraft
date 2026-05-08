"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useInstallPrompt } from "./use-install-prompt";

const DISMISS_KEY = "medicraft_install_banner_dismissed_at";
const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 24 * 3;

export function InstallAppBanner() {
  const { canPromptInstall, installMessage, isInstalled, promptInstall } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const dismissedAt = window.localStorage.getItem(DISMISS_KEY);

    if (!dismissedAt) {
      setDismissed(false);
      return;
    }

    const isExpired =
      Date.now() - Number(dismissedAt) > DISMISS_WINDOW_MS;

    setDismissed(!isExpired);
  }, []);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] px-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-[1.5rem] border border-border/70 bg-background/95 px-4 py-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="pointer-events-auto min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Install MediCraft
          </p>
          <p className="text-sm text-foreground/65">
            Open it like an app on your phone or desktop for faster access.
            {!canPromptInstall && ` ${installMessage}`}
          </p>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <Button
            onClick={promptInstall}
            className={cn("h-11 rounded-full px-5")}
          >
            <Download className="h-4 w-4" />
            Install App
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => {
              setDismissed(true);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
              }
            }}
            aria-label="Dismiss install banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
