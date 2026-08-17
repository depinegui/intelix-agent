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
import { Textarea } from "@/components/ui/textarea";

export function LoginForm() {
  const router = useRouter();
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

      toast.success("Sessão iniciada com sucesso.");
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
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Bem-vindo de volta
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">
          Acesse sua conta
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Informe seu e-mail ou CPF/CNPJ e sua senha para acessar o Intelix.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-identifier">E-mail ou CPF/CNPJ</Label>
          <Input
            id="login-identifier"
            name="identifier"
            autoComplete="username"
            placeholder="Informe seu e-mail ou documento"
            className="h-12 rounded-2xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 rounded-2xl"
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-2xl"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar no Intelix"}
        </Button>
      </form>

      <div className="flex flex-col gap-3 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Link href="/recuperar-senha" className="text-primary hover:underline">
          Esqueceu a senha?
        </Link>
        <Link href="/cadastro" className="text-primary hover:underline">
          Criar uma conta
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
        error instanceof Error ? error.message : "Não foi possível criar a conta.",
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
          Cadastre seus dados para acessar os recursos disponíveis na plataforma.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="register-name">Nome</Label>
          <Input id="register-name" name="name" className="h-12 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">E-mail</Label>
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
              <SelectItem value="JURIDICA">Jurídica</SelectItem>
              <SelectItem value="FISICA">Física</SelectItem>
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

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-2xl"
        disabled={loading}
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Já possui conta?{" "}
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
          : "Não foi possível atualizar a senha.",
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
          Informe o e-mail cadastrado e defina uma nova senha para retomar o acesso à plataforma.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovery-email">E-mail</Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          className="h-12 rounded-2xl"
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
