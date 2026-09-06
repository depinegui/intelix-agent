"use client";

import { useState } from "react";
import { Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SessionUser } from "@/types";

type CompanyType = "FISICA" | "JURIDICA";

interface ProfileViewProps {
  initialUser: SessionUser;
}

const roleLabels = {
  ADMIN: "Administrador",
  ANALYST: "Analista",
  SPECIALIST: "Especialista",
} as const;

export function ProfileView({
  initialUser,
}: ProfileViewProps) {
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [document, setDocument] = useState(
    initialUser.document,
  );
  const [phone, setPhone] = useState(initialUser.phone);
  const [companyType, setCompanyType] =
    useState<CompanyType>(
      initialUser.companyType as CompanyType,
    );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await apiRequest<{
        user: SessionUser;
      }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          email,
          document,
          phone,
          companyType,
        }),
      });

      setName(response.user.name);
      setEmail(response.user.email);
      setDocument(response.user.document);
      setPhone(response.user.phone);
      setCompanyType(
        response.user.companyType as CompanyType,
      );

      toast.success("Perfil atualizado com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o perfil.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-border/70 px-5 py-5 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <UserRound className="size-5 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Meu Perfil
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Atualize seus dados pessoais de acesso ao Intelix Agent.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1fr_280px] md:p-6">
        <form
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">
                Nome
              </Label>

              <Input
                id="profile-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">
                E-mail
              </Label>

              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-document">
                CPF / CNPJ
              </Label>

              <Input
                id="profile-document"
                value={document}
                onChange={(event) =>
                  setDocument(event.target.value)
                }
                required
                minLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">
                Telefone
              </Label>

              <Input
                id="profile-phone"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="max-w-sm space-y-2">
            <Label>
              Tipo de pessoa
            </Label>

            <Select
              value={companyType}
              onValueChange={(value) =>
                setCompanyType(value as CompanyType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="FISICA">
                  Pessoa Física
                </SelectItem>

                <SelectItem value="JURIDICA">
                  Pessoa Jurídica
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
            >
              <Save className="size-4" />

              {saving
                ? "Salvando..."
                : "Salvar alterações"}
            </Button>
          </div>
        </form>

        <aside className="rounded-xl border border-border/70 bg-muted/25 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />

            <p className="font-semibold text-foreground">
              Perfil de acesso
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-border/70 bg-background/70 p-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Nível atual
            </p>

            <p className="mt-2 text-base font-semibold text-foreground">
              {roleLabels[initialUser.role]}
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            O nível de acesso não pode ser alterado pelo próprio usuário.
            Alterações de perfil são realizadas somente por um administrador.
          </p>
        </aside>
      </div>
    </section>
  );
}