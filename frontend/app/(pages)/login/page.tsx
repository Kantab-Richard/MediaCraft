import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,120,80,0.18),_transparent_32%),linear-gradient(180deg,_rgb(var(--background))_0%,_rgba(248,248,252,1)_100%)] px-4 py-28">
      <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
        <Suspense fallback={null}>
          <AuthCard mode="login" />
        </Suspense>
      </div>
    </section>
  );
}
