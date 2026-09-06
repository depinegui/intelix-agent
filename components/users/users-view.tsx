"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  ShieldCheck,
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
  isActive: boolean;
  lastLoginAt: string | null;
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
  const [createOpen, setCreateOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [updating, setUpdating] = useState(false);

  const [changingStatusUserId, setChangingStatusUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [companyType, setCompanyType] =
    useState<CompanyType>("FISICA");
  const [role, setRole] =
    useState<"ANALYST" | "SPECIALIST">("ANALYST");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDocument, setEditDocument] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompanyType, setEditCompanyType] =
    useState<CompanyType>("FISICA");
  const [editRole, setEditRole] =
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

  function clearCreateForm() {
    setName("");
    setEmail("");
    setDocument("");
    setPhone("");
    setPassword("");
    setCompanyType("FISICA");
    setRole("ANALYST");
  }

  function openEditUser(user: UserRecord) {
    if (user.role === "ADMIN") {
      return;
    }

    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDocument(user.document);
    setEditPhone(user.phone);
    setEditCompanyType(user.companyType);
    setEditRole(user.role);
  }

  function closeEditUser() {
    if (updating) {
      return;
    }

    setEditingUser(null);
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
      clearCreateForm();
      setCreateOpen(false);

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

  async function handleUpdateUser(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    setUpdating(true);

    try {
      await apiRequest(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          document: editDocument,
          phone: editPhone,
          companyType: editCompanyType,
          role: editRole,
        }),
      });

      toast.success("Usuario atualizado com sucesso.");
      setEditingUser(null);

      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o usuario.",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleStatusChange(user: UserRecord) {
    const nextIsActive = !user.isActive;
    const confirmed = window.confirm(
      `Tem certeza que deseja ${nextIsActive ? "reativar" : "desativar"} o usuário "${user.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setChangingStatusUserId(user.id);

    try {
      await apiRequest(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      toast.success(
        nextIsActive
          ? "Usuario reativado com sucesso."
          : "Usuario desativado com sucesso.",
      );

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, isActive: nextIsActive }
            : currentUser,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel alterar o status do usuario.",
      );
    } finally {
      setChangingStatusUserId(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch =
      !normalizedSearch ||
      user.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
      user.email.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

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

        <Dialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        >
          <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="size-4" />
            Novo usuário
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                Criar usuário
              </DialogTitle>

              <DialogDescription>
                Cadastre uma conta para acesso ao Intelix Agent.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={handleCreateUser}
            >
              <div className="space-y-2">
                <Label htmlFor="user-name">
                  Nome
                </Label>

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
                  <Label>
                    Tipo de pessoa
                  </Label>

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
                  <Label>
                    Perfil
                  </Label>

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
                  onClick={() =>
                    setCreateOpen(false)
                  }
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

      <div className="grid gap-3 border-b border-border/70 bg-muted/15 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_160px] md:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="pl-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "ALL" | UserRole)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os perfis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os perfis</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="ANALYST">Analista</SelectItem>
            <SelectItem value="SPECIALIST">Especialista</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="INACTIVE">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog
        open={editingUser !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeEditUser();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Editar usuário
            </DialogTitle>

            <DialogDescription>
              Atualize os dados cadastrais e o perfil de acesso deste usuário.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={handleUpdateUser}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-user-name">
                Nome
              </Label>

              <Input
                id="edit-user-name"
                value={editName}
                onChange={(event) =>
                  setEditName(event.target.value)
                }
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-email">
                E-mail
              </Label>

              <Input
                id="edit-user-email"
                type="email"
                value={editEmail}
                onChange={(event) =>
                  setEditEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-user-document">
                  CPF / CNPJ
                </Label>

                <Input
                  id="edit-user-document"
                  value={editDocument}
                  onChange={(event) =>
                    setEditDocument(event.target.value)
                  }
                  required
                  minLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-phone">
                  Telefone
                </Label>

                <Input
                  id="edit-user-phone"
                  value={editPhone}
                  onChange={(event) =>
                    setEditPhone(event.target.value)
                  }
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Tipo de pessoa
                </Label>

                <Select
                  value={editCompanyType}
                  onValueChange={(value) =>
                    setEditCompanyType(
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
                <Label>
                  Perfil
                </Label>

                <Select
                  value={editRole}
                  onValueChange={(value) =>
                    setEditRole(
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

            <p className="text-xs leading-5 text-muted-foreground">
              A senha deste usuário não é alterada por esta edição.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={updating}
                onClick={closeEditUser}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={updating}
              >
                {updating
                  ? "Salvando..."
                  : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="p-5 md:p-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  <th className="px-3 py-3">
                    Usuário
                  </th>

                  <th className="px-3 py-3">
                    Perfil
                  </th>

                  <th className="px-3 py-3">
                    Status
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

                  <th className="px-3 py-3">
                    Último acesso
                  </th>

                  <th className="px-3 py-3 text-right">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
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

                    <td className="px-3 py-4">
                      <span
                        className={
                          user.isActive
                            ? "inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                            : "inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                        }
                      >
                        {user.isActive ? "Ativo" : "Inativo"}
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

                    <td className="px-3 py-4 text-muted-foreground">
                      {user.lastLoginAt
                        ? new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(user.lastLoginAt))
                        : "Nunca acessou"}
                    </td>

                    <td className="px-3 py-4">
                      {user.role === "ADMIN" ? (
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">
                            Protegido
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openEditUser(user)
                            }
                          >
                            <Pencil className="size-4" />
                            Editar
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={changingStatusUserId === user.id}
                            onClick={() =>
                              void handleStatusChange(user)
                            }
                            className={
                              user.isActive
                                ? "text-destructive hover:text-destructive"
                                : "text-primary hover:text-primary"
                            }
                          >
                            {user.isActive ? (
                              <PowerOff className="size-4" />
                            ) : (
                              <Power className="size-4" />
                            )}

                            {changingStatusUserId === user.id
                              ? "Atualizando..."
                              : user.isActive
                                ? "Desativar"
                                : "Reativar"}
                          </Button>
                        </div>
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
