import { SiteShell } from "@/components/layout/site-shell";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <SiteShell>{children}</SiteShell>;
};

export default layout;
