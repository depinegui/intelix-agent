"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRole = "ADMIN" | "ANALYST" | "SPECIALIST";
type CompanyType = "FISICA" | "JURIDICA";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  document: string;
  phone: string;
  companyType: CompanyType;
  role: UserRole;
  createdAt: string;
}

interface UsersResponse {
  users: UserRecord[];
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  ANALYST: "Analista",
  SPECIALIST: "Especialista",
};

export function UsersView() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [companyType, setCompanyType] =
    useState<CompanyType>("FISICA");
  const [role, setRole] =
    useState<"ANALYST" | "SPECIALIST">("ANALYST");

  async function loadUsers() {
    setLoading(true);

    try {
      const response =
        await apiRequest<UsersResponse>("/api/admin/users");

      setUsers(response.users);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function clearForm() {
    setName("");
    setEmail("");
    setDocument("");
    setPhone("");
    setPassword("");
    setCompanyType("FISICA");
    setRole("ANALYST");
  }

  async function handleCreateUser(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setCreating(true);

    try {
      await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          document,
          phone,
          password,
          companyType,
          role,
        }),
      });

      toast.success("Usuario criado com sucesso.");
      clearForm();
      setOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar o usuario.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser(user: UserRecord) {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o usuário "${user.name}"? Esta ação não poderá ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);

    try {
      await apiRequest(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      toast.success("Usuario removido com sucesso.");

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) => currentUser.id !== user.id,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel remover o usuario.",
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon />

            <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Gestão de Usuários
            </h2>
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Crie contas individuais e defina o nível de acesso de cada usuário.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="size-4" />
              Novo usuário
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Criar usuário</DialogTitle>

              <DialogDescription>
                Cadastre uma conta para acesso ao Intelix Agent.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={handleCreateUser}
            >
              <div className="space-y-2">
                <Label htmlFor="user-name">Nome</Label>

                <Input
                  id="user-name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Nome completo"
                  required
                  minLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">
                  E-mail
                </Label>

                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="usuario@empresa.com.br"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user-document">
                    CPF / CNPJ
                  </Label>

                  <Input
                    id="user-document"
                    value={document}
                    onChange={(event) =>
                      setDocument(event.target.value)
                    }
                    placeholder="Documento"
                    required
                    minLength={11}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-phone">
                    Telefone
                  </Label>

                  <Input
                    id="user-phone"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="(49) 99999-9999"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de pessoa</Label>

                  <Select
                    value={companyType}
                    onValueChange={(value) =>
                      setCompanyType(
                        value as CompanyType,
                      )
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

                <div className="space-y-2">
                  <Label>Perfil</Label>

                  <Select
                    value={role}
                    onValueChange={(value) =>
                      setRole(
                        value as
                          | "ANALYST"
                          | "SPECIALIST",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ANALYST">
                        Analista
                      </SelectItem>

                      <SelectItem value="SPECIALIST">
                        Especialista
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">
                  Senha inicial
                </Label>

                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Mínimo de 8 caracteres"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={creating}
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={creating}
                >
                  {creating
                    ? "Criando..."
                    : "Criar usuário"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-5 md:p-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Carregando usuários...
          </div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  <th className="px-3 py-3">
                    Usuário
                  </th>

                  <th className="px-3 py-3">
                    Perfil
                  </th>

                  <th className="px-3 py-3">
                    Documento
                  </th>

                  <th className="px-3 py-3">
                    Telefone
                  </th>

                  <th className="px-3 py-3">
                    Cadastro
                  </th>

                  <th className="px-3 py-3 text-right">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                          <UserRound className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                          <p className="font-semibold text-foreground">
                            {user.name}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-foreground">
                        <ShieldCheck className="size-3.5" />
                        {roleLabels[user.role]}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {user.document}
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {user.phone}
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {new Intl.DateTimeFormat(
                        "pt-BR",
                      ).format(
                        new Date(user.createdAt),
                      )}
                    </td>

                    <td className="px-3 py-4 text-right">
                      {user.role === "ADMIN" ? (
                        <span className="text-xs text-muted-foreground">
                          Protegido
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            deletingUserId === user.id
                          }
                          onClick={() =>
                            void handleDeleteUser(user)
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />

                          {deletingUserId === user.id
                            ? "Removendo..."
                            : "Remover"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function UsersIcon() {
  return (
    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
      <UserRound className="size-4 text-primary" />
    </div>
  );
}