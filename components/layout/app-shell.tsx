"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  BotMessageSquare,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Settings,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import type { Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const navItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
}> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "VIEW_DASHBOARD",
  },
  {
    href: "/chat-ia",
    label: "Chat IA",
    icon: BotMessageSquare,
    permission: "USE_CHAT",
  },
  {
    href: "/chamados",
    label: "Chamados",
    icon: Ticket,
    permission: "VIEW_TICKETS",
  },
  {
    href: "/chamados/novo",
    label: "Novo Chamado",
    icon: PlusSquare,
    permission: "CREATE_TICKET",
  },
  {
    href: "/base-conhecimento",
    label: "Base de Conhecimento",
    icon: BookOpen,
    permission: "VIEW_KNOWLEDGE",
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Users,
    permission: "MANAGE_USERS",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    permission: "VIEW_SETTINGS",
  },
];

const roleLabels: Record<SessionUser["role"], string> = {
  ADMIN: "Administrador",
  ANALYST: "Analista",
  SPECIALIST: "Especialista",
};

interface AppShellProps {
  user: SessionUser;
  mode: "demo" | "database";
  permissions: Permission[];
  children: React.ReactNode;
}

export function AppShell({
  user,
  permissions,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const visibleNavItems = navItems.filter((item) =>
    permissions.includes(item.permission),
  );

  async function handleLogout() {
    setLoading(true);

    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });

      toast.success("Sessão encerrada.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao sair.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-3 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1800px] gap-3">
        <aside className="sidebar-shell hidden w-[252px] rounded-2xl border border-white/8 p-4 text-sidebar-foreground shadow-[0_2px_8px_rgba(20,31,47,0.14)] lg:flex lg:flex-col">
          <BrandMark inverted />

          <nav className="mt-8 space-y-1">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/11 text-white ring-1 ring-white/10"
                      : "text-sidebar-foreground/68 hover:bg-white/7 hover:text-white",
                  )}
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 rounded-xl border border-white/10 bg-black/8 p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">
                {user.name}
              </p>

              <p className="text-xs font-semibold tracking-[0.08em] text-sidebar-foreground/72 uppercase">
                {roleLabels[user.role]}
              </p>

              <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
                <span
                  className="size-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                Online
              </div>
            </div>

            <Link
              href="/perfil"
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/7 px-4 text-sm font-medium text-white transition-colors hover:bg-white/12",
                pathname === "/perfil" &&
                  "bg-white/12 ring-1 ring-white/10",
              )}
            >
              <UserRound className="size-4" />
              Meu Perfil
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="h-10 w-full rounded-lg border-white/12 bg-white/7 text-white hover:bg-white/12"
              disabled={loading}
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="surface-card flex flex-col gap-3 p-4 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <BrandMark compact />

              <div className="flex items-center gap-2">
                <Link
                  href="/perfil"
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted",
                    pathname === "/perfil" &&
                      "bg-muted",
                  )}
                >
                  <UserRound className="size-4" />
                  Perfil
                </Link>

                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  <LogOut className="size-4" />
                  Sair
                </Button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {visibleNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <header className="surface-card flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">
                Intelix Agent
              </h1>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Suporte inteligente para sistemas de gestão empresarial
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start gap-1 md:items-end">
                <p className="text-sm font-semibold text-foreground">
                  {user.name}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    {roleLabels[user.role]}
                  </span>

                  <span className="text-muted-foreground/40">
                    ·
                  </span>

                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span
                      className="size-1.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    Online
                  </span>
                </div>
              </div>

              <Link
                href="/perfil"
                title="Meu Perfil"
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  pathname === "/perfil" &&
                    "bg-primary/10 text-primary",
                )}
              >
                <UserRound className="size-5" />
              </Link>
            </div>
          </header>

          <div className="min-h-[50vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}