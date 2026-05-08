import { Downloader, NavConfig } from "@/types/nav";
import {
  BarChart3,
  Bot,
  Download,
  FolderKanban,
  Home,
  Layers3,
  Sparkles,
  Webhook,
} from "lucide-react";
import { downloaders } from "./downloaders";

export const navConfig: NavConfig = {
  mainNav: [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Workspace",
      href: "/workspace",
      icon: Layers3,
    },
    {
      name: "Capabilities",
      href: "#",
      icon: Sparkles,
      subMenu: [
        {
          name: "Studio Tools",
          href: "/workspace",
          description: "Clipping, subtitle, transcript, and conversion flows.",
          icon: Bot,
        },
        {
          name: "Cloud Workspace",
          href: "/workspace",
          description: "Projects, collections, history, and reusable lanes.",
          icon: FolderKanban,
        },
        {
          name: "Analytics",
          href: "/workspace",
          description: "Usage, performance, and output tracking surfaces.",
          icon: BarChart3,
        },
        {
          name: "Developer API",
          href: "/workspace",
          description: "Webhook-ready platform direction for integrations.",
          icon: Webhook,
        },
      ],
    },
    {
      name: "Downloaders",
      href: "#",
      icon: Download,
      subMenu: downloaders,
    },
  ],
};
