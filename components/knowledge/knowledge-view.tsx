"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import type {
  KnowledgeDocument,
  KnowledgeInput,
  KnowledgeOverviewStats,
} from "@/types";
import { categoryLabels, formatShortDate } from "@/utils/format";
import { getKnowledgeHighlights } from "@/utils/knowledge-highlights";

const knowledgeCategories = [
  "NF_E",
  "NFC_E",
  "ESTOQUE",
  "INVENTARIO",
  "PCP",
  "PROCEDIMENTOS",
] as const;

interface KnowledgeViewProps {
  initialDocuments: KnowledgeDocument[];
  stats: KnowledgeOverviewStats;
  canManage: boolean;
  canDelete: boolean;
}

const emptyForm: KnowledgeInput = {
  title: "",
  excerpt: "",
  content: "",
  category: "NF_E",
  tags: [],
};

export function KnowledgeView({
  initialDocuments,
  stats,
  canManage,
  canDelete,
}: KnowledgeViewProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KnowledgeInput>(emptyForm);
  const [tagInput, setTagInput] = useState("");

  const deferredSearch = useDeferredValue(search);
  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const haystack = `${document.title} ${document.excerpt} ${document.content} ${document.tags.join(" ")}`.toLowerCase();
      return haystack.includes(deferredSearch.toLowerCase());
    });
  }, [deferredSearch, documents]);
  const highlights = useMemo(
    () => getKnowledgeHighlights(documents),
    [documents],
  );

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setTagInput("");
    setDialogOpen(true);
  }

  function openEditDialog(document: KnowledgeDocument) {
    setEditingId(document.id);
    setForm({
      title: document.title,
      excerpt: document.excerpt,
      content: document.content,
      category: document.category,
      tags: document.tags,
    });
    setTagInput(document.tags.join(", "));
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setLoading(true);
    const payload: KnowledgeInput = {
      ...form,
      tags: tagInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        const response = await apiRequest<{ document: KnowledgeDocument }>(
          `/api/knowledge/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );

        setDocuments((current) =>
          current.map((item) =>
            item.id === response.document.id ? response.document : item,
          ),
        );
        toast.success("Documento atualizado.");
      } else {
        const response = await apiRequest<{ document: KnowledgeDocument }>(
          "/api/knowledge",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        setDocuments((current) => [response.document, ...current]);
        toast.success("Documento criado.");
      }

      setDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao salvar documento.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja remover este documento da base?")) {
      return;
    }

    try {
      await apiRequest(`/api/knowledge/${id}`, {
        method: "DELETE",
      });
      setDocuments((current) => current.filter((document) => document.id !== id));
      toast.success("Documento removido.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao remover documento.",
      );
    }
  }

  return (
    <>
      <div className="grid gap-4">
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[28px] border-none bg-[#f4fbfc] shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
            <CardHeader className="px-5 pt-5">
              <CardDescription>Documentos indexados</CardDescription>
              <CardTitle className="text-4xl font-semibold">
                {documents.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-[28px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
            <CardHeader className="px-5 pt-5">
              <CardDescription>Precisao RAG</CardDescription>
              <CardTitle className="text-4xl font-semibold">
                {stats.ragAccuracy}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-[28px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
            <CardHeader className="px-5 pt-5">
              <CardDescription>Tempo medio de resposta</CardDescription>
              <CardTitle className="text-4xl font-semibold">
                {stats.averageResponse}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="surface-card p-6">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-xl">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 rounded-2xl pl-11"
                placeholder="Buscar na base de conhecimento..."
              />
            </div>
            {canManage ? (
              <Button onClick={openCreateDialog} size="lg" className="h-12 rounded-2xl px-6">
                <Plus className="size-4" />
                Novo documento
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.category}
                className="rounded-[26px] border border-border/70 bg-muted/45 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {highlight.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {highlight.documents} docs
                    </p>
                  </div>
                  <Badge variant="secondary">{highlight.documents}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {highlight.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className="rounded-[28px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]"
            >
              <CardHeader className="px-5 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardDescription>
                      {categoryLabels[document.category]}
                    </CardDescription>
                    <CardTitle className="mt-2 text-2xl font-semibold">
                      {document.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary">{document.views} views</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  {document.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
                  <span>{formatShortDate(document.updatedAt)}</span>
                  {canManage || canDelete ? (
                    <div className="flex gap-2">
                      {canManage ? (
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => openEditDialog(document)}
                        >
                          <Edit3 className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => handleDelete(document.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {editingId ? "Editar documento" : "Novo documento"}
            </DialogTitle>
            <DialogDescription>
              Cadastro administrativo; a indexacao RAG nao e automatica.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 px-6 pb-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="knowledge-title">Titulo</Label>
              <Input
                id="knowledge-title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    category: value as KnowledgeInput["category"],
                  }))
                }
              >
                <SelectTrigger className="h-12 w-full rounded-2xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {categoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="knowledge-tags">Tags</Label>
              <Input
                id="knowledge-tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                className="h-12 rounded-2xl"
                placeholder="nf-e, sefaz, duplicidade"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="knowledge-excerpt">Resumo</Label>
              <Textarea
                id="knowledge-excerpt"
                rows={3}
                value={form.excerpt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, excerpt: event.target.value }))
                }
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="knowledge-content">Conteudo</Label>
              <Textarea
                id="knowledge-content"
                rows={10}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
                className="rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
