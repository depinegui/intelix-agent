"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState("corporativo");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setLoading(true);

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: String(formData.get("identifier") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      toast.success("Sessao iniciada com sucesso.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-foreground">
          Faca login para continuar
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Entre com credenciais corporativas ou pessoais para acessar dashboard,
          chat IA e chamados.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList className="w-full rounded-2xl bg-muted/70 p-1">
          <TabsTrigger value="corporativo">Login Corporativo</TabsTrigger>
          <TabsTrigger value="pessoal">Login Pessoal</TabsTrigger>
        </TabsList>

        <TabsContent value="corporativo" className="space-y-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-identifier-corporativo">CNPJ</Label>
              <Input
                id="login-identifier-corporativo"
                name="identifier"
                placeholder="12.345.678/0001-99"
                className="h-12 rounded-2xl"
                defaultValue="12.345.678/0001-99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password-corporativo">Senha</Label>
              <Input
                id="login-password-corporativo"
                name="password"
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-2xl"
                defaultValue="Intelix@2026"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-2xl"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Acessar Plataforma"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="pessoal" className="space-y-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-identifier-pessoal">Email</Label>
              <Input
                id="login-identifier-pessoal"
                name="identifier"
                type="email"
                placeholder="seu@email.com"
                className="h-12 rounded-2xl"
                defaultValue="analista@intelix.ai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password-pessoal">Senha</Label>
              <Input
                id="login-password-pessoal"
                name="password"
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-2xl"
                defaultValue="Intelix@2026"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-2xl"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar com Email"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <Link href="/recuperar-senha" className="text-primary hover:underline">
          Esqueceu a senha?
        </Link>
        <Link href="/cadastro" className="text-primary hover:underline">
          Solicitar acesso
        </Link>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companyType, setCompanyType] = useState("JURIDICA");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setLoading(true);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          document: String(formData.get("document") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          companyType,
        }),
      });

      toast.success("Conta criada com sucesso.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel criar a conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-foreground">
          Crie sua conta Intelix
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Cadastre sua equipe para acessar a central de suporte, chamados e a
          base inteligente de conhecimento.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="register-name">Nome</Label>
          <Input id="register-name" name="name" className="h-12 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">E-mail corporativo</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={companyType}
            onValueChange={(value) => setCompanyType(value ?? "JURIDICA")}
          >
            <SelectTrigger className="h-12 w-full rounded-2xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JURIDICA">Juridica</SelectItem>
              <SelectItem value="FISICA">Fisica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-document">CPF/CNPJ</Label>
          <Input
            id="register-document"
            name="document"
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-phone">Telefone</Label>
          <Input
            id="register-phone"
            name="phone"
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Senha</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            className="h-12 rounded-2xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-context">Observacoes de implantacao</Label>
        <Textarea
          id="register-context"
          name="context"
          rows={4}
          className="rounded-2xl"
          placeholder="Descreva o ERP, modulos atendidos e contexto operacional."
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-2xl"
        disabled={loading}
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Ja possui conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}

export function RecoveryForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      toast.error("As senhas precisam ser iguais.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password,
        }),
      });

      toast.success("Senha atualizada com sucesso.");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar a senha.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-foreground">
          Crie sua nova senha
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Informe o email cadastrado e defina uma nova senha para retomar o
          acesso a plataforma.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovery-email">Email</Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          className="h-12 rounded-2xl"
          defaultValue="analista@intelix.ai"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recovery-password">Senha</Label>
        <Input
          id="recovery-password"
          name="password"
          type="password"
          className="h-12 rounded-2xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recovery-confirm-password">Confirmar senha</Label>
        <Input
          id="recovery-confirm-password"
          name="confirmPassword"
          type="password"
          className="h-12 rounded-2xl"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-2xl"
        disabled={loading}
      >
        {loading ? "Atualizando..." : "Atualizar senha"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Lembrou da senha?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
