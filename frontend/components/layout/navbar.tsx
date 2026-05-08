"use client";

import { navConfig } from "@/config/nav";
import { clearAuthSession, getStoredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types/nav";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "../ui/button";
import { LogoIcon } from "../ui/icons";
import { ModeToggle } from "../ui/theme-toggle";
import { InstallAppButton } from "./install-app-button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userState, setUserState] = useState<ReturnType<typeof getStoredUser>>(null);
  const router = useRouter();

  useEffect(() => {
    const syncUser = () => {
      setUserState(getStoredUser());
    };

    syncUser();
    window.addEventListener("medicraft-auth-changed", syncUser);

    return () => {
      window.removeEventListener("medicraft-auth-changed", syncUser);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setUserState(null);
    setIsOpen(false);
    router.refresh();
  };

  const handleDropdownClick = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const getNavItemKey = (item: { name: string; href: string }) =>
    `${item.name}-${item.href}`;

  const displayName =
    userState?.name?.trim() || userState?.email?.split("@")[0] || "Profile";

  const avatarInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const profileAvatar = (
    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary">
      {userState?.avatarUrl ? (
        <Image
          src={userState.avatarUrl}
          alt={displayName}
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{avatarInitials || "P"}</span>
      )}
    </div>
  );

  const NavLink = ({ item }: { item: NavItem }) => {
    if (item.subMenu?.length) {
      return (
        <div className="relative group">
          <button
            onClick={() => handleDropdownClick(item.name)}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/90"
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            {item.name}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                activeDropdown === item.name && "rotate-180"
              )}
            />
          </button>
          <div className="absolute left-0 top-full hidden w-[380px] pt-2 group-hover:block">
            <div className="rounded-lg border bg-background p-3 shadow-lg backdrop-blur-sm">
              <div className="grid gap-2">
                {item.subMenu.map((subItem) => (
                  <Link
                    key={getNavItemKey(subItem)}
                    href={subItem.href}
                    className={cn(
                      "grid grid-cols-[32px_1fr] items-center gap-4 rounded-md p-3 text-sm transition-colors",
                      "isComingSoon" in subItem && subItem.isComingSoon
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-primary/10"
                    )}
                    onClick={(e) => {
                      if ("isComingSoon" in subItem && subItem.isComingSoon) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {subItem.icon && (
                      <subItem.icon className="h-8 w-8 text-foreground/60" />
                    )}
                    {subItem.logo && (
                      <Image
                        src={subItem.logo}
                        alt={subItem.name}
                        width={32}
                        height={32}
                        className="h-8 w-8"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground/90">
                          {subItem.name}
                        </span>
                        {"isComingSoon" in subItem && subItem.isComingSoon && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      {subItem.description && (
                        <span className="line-clamp-2 text-sm text-foreground/60">
                          {subItem.description}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium transition-colors",
          item.href === "/"
            ? "text-foreground/90"
            : "text-foreground/60 hover:text-foreground/90"
        )}
      >
        {item.icon && <item.icon className="h-4 w-4" />}
        {item.name}
      </Link>
    );
  };

  const MobileNavLink = ({ item }: { item: NavItem }) => {
    if (item.subMenu?.length) {
      return (
        <div>
          <button
            onClick={() => handleDropdownClick(item.name)}
            className="flex w-full items-center justify-between py-2 text-xl font-medium"
          >
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className="h-6 w-6" />}
              {item.name}
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                activeDropdown === item.name && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              activeDropdown === item.name
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 py-4 pl-8">
                {item.subMenu.map((subItem, index) => (
                  <motion.div
                    key={getNavItemKey(subItem)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: activeDropdown === item.name ? 1 : 0,
                      x: activeDropdown === item.name ? 0 : -20,
                      transition: {
                        duration: 0.3,
                        delay: index * 0.1,
                      },
                    }}
                  >
                    <Link
                      href={subItem.href}
                      className={cn(
                        "flex items-start gap-4",
                        "isComingSoon" in subItem && subItem.isComingSoon
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      )}
                      onClick={(e) => {
                        if ("isComingSoon" in subItem && subItem.isComingSoon) {
                          e.preventDefault();
                        } else {
                          setIsOpen(false);
                        }
                      }}
                    >
                      {subItem.logo && (
                        <Image
                          src={subItem.logo}
                          alt={subItem.name}
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      )}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium text-foreground/90">
                            {subItem.name}
                          </span>
                          {"isComingSoon" in subItem &&
                            subItem.isComingSoon && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Coming Soon
                              </span>
                            )}
                        </div>
                        {subItem.description && (
                          <span className="text-sm text-foreground/60">
                            {subItem.description}
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        className="flex items-center gap-2 py-2 text-xl font-medium"
        onClick={() => setIsOpen(false)}
      >
        {item.icon && <item.icon className="h-6 w-6" />}
        {item.name}
      </Link>
    );
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 z-50 w-screen border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          "data-[scroll-locked=true]:mr-[var(--removed-body-scroll-bar-size)]"
        )}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={30} />
              <span className="text-lg md:text-xl font-bold tracking-tight truncate">
                MediCraft<span className="text-orange-500">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-6 md:flex">
            {navConfig.mainNav.map((item) => (
              <NavLink key={getNavItemKey(item)} item={item} />
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <InstallAppButton />
            <ModeToggle />
            {userState ? (
              <>
                {userState.isAdmin && (
                  <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>
                    Dashboard
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  {profileAvatar}
                  <span className="max-w-[180px] truncate text-sm font-medium text-foreground/80">
                    {displayName}
                  </span>
                </div>
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                  Login
                </Link>
                <Link href="/register" className={buttonVariants({ className: "bg-primary px-6" })}>
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-50 h-12 w-12 p-0"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col justify-center items-center">
                <span
                  className={cn(
                    "absolute h-0.5 w-6 bg-foreground transition-all duration-300",
                    isOpen ? "rotate-45 translate-y-0" : "-translate-y-2"
                  )}
                />
                <span
                  className={cn(
                    "absolute h-0.5 w-6 bg-foreground transition-all duration-300",
                    isOpen ? "opacity-0" : "opacity-100"
                  )}
                />
                <span
                  className={cn(
                    "absolute h-0.5 w-6 bg-foreground transition-all duration-300",
                    isOpen ? "-rotate-45 translate-y-0" : "translate-y-2"
                  )}
                />
              </div>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Full Screen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed right-0 top-0 h-screen w-full max-w-md border-l bg-background p-6 shadow-lg pt-20"
            >
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-4">
                  {navConfig.mainNav.map((item) => (
                    <MobileNavLink key={getNavItemKey(item)} item={item} />
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-6">
                  <InstallAppButton mobileFullWidth />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60">
                      Switch theme
                    </span>
                    <ModeToggle />
                  </div>
                  {userState ? (
                    <>
                      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
                        {profileAvatar}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-foreground/60">
                            {userState.email}
                          </p>
                        </div>
                      </div>
                      {userState.isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className={buttonVariants({
                            variant: "ghost",
                            className: "w-full justify-center",
                          })}
                        >
                          Dashboard
                        </Link>
                      )}
                      <Button variant="ghost" className="w-full justify-center" onClick={handleLogout}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className={buttonVariants({
                          variant: "ghost",
                          className: "w-full justify-center",
                        })}
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsOpen(false)}
                        className={buttonVariants({
                          className: "w-full justify-center bg-primary",
                        })}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
