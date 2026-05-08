"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useInstallPrompt } from "./use-install-prompt";

type InstallAppButtonProps = {
  className?: string;
  mobileFullWidth?: boolean;
  variant?: "default" | "ghost" | "outline";
};

export function InstallAppButton({
  className,
  mobileFullWidth = false,
  variant = "default",
}: InstallAppButtonProps) {
  const { isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled) {
    return null;
  }

  if (mobileFullWidth) {
    return (
      <Button
        onClick={promptInstall}
        className={cn("w-full justify-center bg-primary", className)}
        variant={variant}
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={promptInstall}
      className={cn(
        buttonVariants({
          variant,
          className:
            variant === "default"
              ? "bg-primary px-5 text-white hover:bg-primary/90"
              : "",
        }),
        className
      )}
    >
      <Download className="h-4 w-4" />
      Install App
    </button>
  );
}
