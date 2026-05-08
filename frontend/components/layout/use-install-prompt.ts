"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export type InstallSupportState =
  | "unknown"
  | "native-prompt"
  | "ios-share"
  | "open-supported-browser";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function detectInstallSupportState(): InstallSupportState {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const userAgent = window.navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|Edg|OPR|Firefox/i.test(userAgent);

  if (isIOS && isSafari) {
    return "ios-share";
  }

  return "open-supported-browser";
}

function getInstallMessage(state: InstallSupportState) {
  switch (state) {
    case "ios-share":
      return "Use Safari Share and choose Add to Home Screen.";
    case "open-supported-browser":
      return "This browser cannot show the install prompt. Open the app in Chrome or Edge to install it.";
    default:
      return "This browser cannot show the install prompt. Open the app in Chrome or Edge to install it.";
  }
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [supportState, setSupportState] =
    useState<InstallSupportState>("unknown");

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setSupportState("native-prompt");
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success("MediCraft installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const timer = window.setTimeout(() => {
      setSupportState((current) =>
        current === "unknown" ? detectInstallSupportState() : current
      );
    }, 2500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      toast(getInstallMessage(supportState));
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      return true;
    }

    return false;
  };

  return {
    canPromptInstall: Boolean(deferredPrompt),
    installMessage: getInstallMessage(supportState),
    installSupportState: supportState,
    isInstalled,
    promptInstall,
  };
}
