"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Search, SlidersHorizontal } from "lucide-react";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "FEEDBACK" | "LOGIN" | "UPLOAD" | "PROCESS" | "ESCALATE";
type AuditEntityType = "USER" | "KNOWLEDGE_DOCUMENT" | "TICKET" | "CHAT_MESSAGE";

type AuditLog = {
  id: string;
  userId: string | null;
  userName: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  description: string;
  metadata: Record<string, string | number | boolean> | null;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLog[];
  users: Array<{ id: string; name: string }>;
  total: number;
  page: number;
  pageSize: number;
};

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Criação", UPDATE: "Atualização", DELETE: "Exclusão",
  STATUS_CHANGE: "Status", FEEDBACK: "Feedback", LOGIN: "Login",
  UPLOAD: "Upload", PROCESS: "Processamento", ESCALATE: "Escalada",
};

const entityLabels: Record<AuditEntityType, string> = {
  USER: "Usuário", KNOWLEDGE_DOCUMENT: "Documento", TICKET: "Chamado", CHAT_MESSAGE: "Mensagem do chat",
};

const metadataLabels: Record<string, string> = {
  role: "Perfil", category: "Categoria", size: "Tamanho", processingStatus: "Processamento",
  chunksIndexed: "Indexado", protocol: "Protocolo", priority: "Prioridade", status: "Status",
  previousStatus: "Status anterior", newStatus: "Novo status", previousRole: "Perfil anterior",
  newRole: "Novo perfil", isActive: "Ativo", confidence: "Confiança", responseTimeMs: "Tempo de resposta (ms)",
  retrievedSourcesCount: "Fontes consultadas", withoutContext: "Sem contexto", previousFeedback: "Feedback anterior",
  newFeedback: "Novo feedback", feedbackReason: "Motivo", fileName: "Arquivo",
};

export function AuditView() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState("ALL");
  const [action, setAction] = useState<"ALL" | AuditAction>("ALL");
  const [entityType, setEntityType] = useState<"ALL" | AuditEntityType>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (query.trim()) params.set("q", query.trim());
    if (user !== "ALL") params.set("user", user);
    if (action !== "ALL") params.set("action", action);
    if (entityType !== "ALL") params.set("entityType", entityType);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    try {
      setData(await apiRequest<AuditResponse>(`/api/audit?${params}`));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a auditoria.");
    } finally {
      setLoading(false);
    }
  }, [action, entityType, from, page, query, to, user]);

  useEffect(() => { void load(); }, [load]);

  function resetFilters() {
    setPage(1); setQuery(""); setUser("ALL"); setAction("ALL"); setEntityType("ALL"); setFrom(""); setTo("");
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 25));

  return (
    <section className="space-y-4">
      <Card className="py-0">
        <CardHeader className="border-b border-border/70 px-5 py-5 md:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><ClipboardList className="size-5 text-primary" /></div>
            <div><CardTitle>Auditoria</CardTitle><CardDescription className="mt-1">Eventos administrativos e operacionais persistidos no sistema.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 border-b border-border/70 bg-muted/15 px-5 py-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_160px_160px_150px_150px] md:px-6">
            <div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Buscar descrição, usuário ou entidade" className="pl-9" /></div>
            <Select value={user} onValueChange={(value) => { setPage(1); setUser(value ?? "ALL"); }}><SelectTrigger className="w-full"><SelectValue placeholder="Todos os usuários" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos os usuários</SelectItem>{data?.users.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
            <Select value={action} onValueChange={(value) => { setPage(1); setAction(value as "ALL" | AuditAction); }}><SelectTrigger className="w-full"><SelectValue placeholder="Todas as ações" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todas as ações</SelectItem>{Object.entries(actionLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
            <Select value={entityType} onValueChange={(value) => { setPage(1); setEntityType(value as "ALL" | AuditEntityType); }}><SelectTrigger className="w-full"><SelectValue placeholder="Todas as entidades" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todas as entidades</SelectItem>{Object.entries(entityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
            <Input type="date" aria-label="Data inicial" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} />
            <Input type="date" aria-label="Data final" value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} />
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3 md:px-6"><p className="text-sm text-muted-foreground"><SlidersHorizontal className="mr-1.5 inline size-4" />{data ? `${data.total} registro${data.total === 1 ? "" : "s"}` : "Carregando registros..."}</p><Button type="button" variant="outline" size="sm" onClick={resetFilters}>Limpar filtros</Button></div>
          {error ? <div className="px-5 py-10 text-center text-sm text-destructive">{error}</div> : loading ? <div className="px-5 py-10 text-center text-sm text-muted-foreground">Carregando auditoria...</div> : data?.logs.length === 0 ? <div className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum evento encontrado para os filtros informados.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1060px] text-left text-sm"><thead><tr className="border-b border-border/70 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"><th className="px-5 py-3 md:px-6">Data e hora</th><th className="px-3 py-3">Usuário</th><th className="px-3 py-3">Ação</th><th className="px-3 py-3">Entidade</th><th className="px-3 py-3">Descrição</th><th className="px-3 py-3 pr-5 md:pr-6">Detalhes</th></tr></thead><tbody>{data?.logs.map((log) => <tr key={log.id} className="border-b border-border/50 align-top last:border-0"><td className="px-5 py-4 whitespace-nowrap text-muted-foreground md:px-6">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.createdAt))}</td><td className="px-3 py-4 font-medium text-foreground">{log.userName ?? "Sistema"}</td><td className="px-3 py-4"><span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold">{actionLabels[log.action]}</span></td><td className="px-3 py-4 text-muted-foreground"><p>{entityLabels[log.entityType]}</p>{log.entityId && <p className="mt-1 max-w-36 truncate font-mono text-xs" title={log.entityId}>{log.entityId}</p>}</td><td className="px-3 py-4 text-foreground">{log.description}</td><td className="px-3 py-4 pr-5 text-xs text-muted-foreground md:pr-6">{log.metadata ? <dl className="space-y-1">{Object.entries(log.metadata).map(([key, value]) => <div key={key} className="flex gap-1.5"><dt>{metadataLabels[key] ?? key}:</dt><dd className="font-medium text-foreground">{String(value)}</dd></div>)}</dl> : "—"}</td></tr>)}</tbody></table></div>}
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6"><p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={loading || page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></div>
        </CardContent>
      </Card>
    </section>
  );
}
