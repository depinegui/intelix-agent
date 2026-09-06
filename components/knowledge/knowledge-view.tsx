"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Edit3,
  FileUp,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
  KnowledgeDocumentOrigin,
  KnowledgeInput,
  KnowledgeProcessingStatus,
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

type KnowledgeCategory = (typeof knowledgeCategories)[number];

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

const processingStatusLabels: Record<KnowledgeProcessingStatus, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  READY: "Pronto",
  ERROR: "Erro",
};

const originLabels: Record<KnowledgeDocumentOrigin, string> = {
  MANUAL: "Cadastro manual",
  UPLOAD: "Upload",
  LEGACY_IMPORT: "Base canônica importada",
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

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] =
    useState<KnowledgeCategory>("PROCEDIMENTOS");
  const [uploading, setUploading] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const haystack =
        `${document.title} ${document.excerpt} ${document.content} ${document.tags.join(
          " ",
        )}`.toLowerCase();

      return haystack.includes(deferredSearch.toLowerCase());
    });
  }, [deferredSearch, documents]);

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.processingStatus === "READY"),
    [documents],
  );

  const highlights = useMemo(
    () => getKnowledgeHighlights(readyDocuments),
    [readyDocuments],
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

  function openUploadDialog() {
    setUploadFile(null);
    setUploadCategory("PROCEDIMENTOS");
    setUploadDialogOpen(true);
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
        error instanceof Error
          ? error.message
          : "Falha ao salvar documento.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) {
      toast.error("Selecione um arquivo para enviar.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);

      const response = await apiRequest<{
        message: string;
        document: KnowledgeDocument;
      }>("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (response.document.processingStatus === "ERROR") {
        toast.error(response.message);
      } else {
        toast.success(response.message);
      }

      setDocuments((current) => {
        const existing = current.find((document) => document.id === response.document.id);
        return existing
          ? current.map((document) => document.id === response.document.id ? response.document : document)
          : [response.document, ...current];
      });

      setUploadFile(null);
      setUploadDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar o arquivo.",
      );
    } finally {
      setUploading(false);
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

      setDocuments((current) =>
        current.filter((document) => document.id !== id),
      );

      toast.success("Documento removido.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao remover documento.",
      );
    }
  }

  return (
    <>
      <div className="grid gap-3">
        <section className="grid gap-3 md:grid-cols-3">
          <Card className="border-border bg-card shadow-[0_1px_2px_rgba(31,45,61,0.035)]">
            <CardHeader className="px-4 pt-4">
              <CardDescription className="text-xs font-semibold tracking-[0.08em] uppercase">
                Documentos prontos
              </CardDescription>

              <CardTitle className="text-3xl font-semibold">
                {readyDocuments.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="px-4 pt-4">
              <CardDescription className="text-xs font-semibold tracking-[0.08em] uppercase">
                Qualidade das respostas
              </CardDescription>

              <CardTitle className="text-3xl font-semibold">
                {stats.ragAccuracy}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="px-4 pt-4">
              <CardDescription className="text-xs font-semibold tracking-[0.08em] uppercase">
                Tempo de resposta
              </CardDescription>

              <CardTitle className="text-3xl font-semibold">
                {stats.averageResponse}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="surface-card p-4 md:p-5">
          <div className="mb-5 flex flex-col gap-3 border-b border-border/70 pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-xl">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 rounded-lg bg-muted/20 pl-11"
                placeholder="Buscar na base de conhecimento..."
              />
            </div>

            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-10 rounded-lg px-5"
                  onClick={openUploadDialog}
                >
                  <FileUp className="size-4" />
                  Enviar arquivo
                </Button>

                <Button
                  type="button"
                  onClick={openCreateDialog}
                  size="lg"
                  className="h-10 rounded-lg px-5"
                >
                  <Plus className="size-4" />
                  Novo documento
                </Button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.category}
                className="rounded-lg border border-border/70 bg-muted/30 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {highlight.label}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {highlight.documents} docs
                    </p>
                  </div>

                  <Badge variant="secondary">
                    {highlight.documents}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {highlight.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className="border-border shadow-[0_1px_2px_rgba(31,45,61,0.035)] transition-shadow hover:shadow-[0_3px_10px_rgba(31,45,61,0.07)]"
            >
              <CardHeader className="px-4 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardDescription>
                      {categoryLabels[document.category]}
                    </CardDescription>

                    <CardTitle className="mt-1 text-xl font-semibold">
                      {document.title}
                    </CardTitle>
                  </div>

                  <Badge variant={document.processingStatus === "ERROR" ? "destructive" : "secondary"}>
                    {processingStatusLabels[document.processingStatus]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 px-4 pb-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {document.excerpt}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {originLabels[document.origin]}
                  </span>
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {document.processingError ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs leading-5 text-destructive">
                    {document.processingError}
                  </p>
                ) : null}

                <div className="flex items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
                  <span>{formatShortDate(document.processedAt ?? document.updatedAt)}</span>

                  {canManage || canDelete ? (
                    <div className="flex gap-2">
                      {canManage ? (
                        <Button
                          variant="outline"
                          className="size-8 rounded-md"
                          onClick={() => openEditDialog(document)}
                        >
                          <Edit3 className="size-4" />
                        </Button>
                      ) : null}

                      {canDelete ? (
                        <Button
                          variant="outline"
                          className="size-8 rounded-md"
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
        <DialogContent className="max-w-3xl rounded-xl p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>
              {editingId ? "Editar documento" : "Novo documento"}
            </DialogTitle>

            <DialogDescription>
              O cadastro organiza esta base. A disponibilidade no assistente
              pode depender de atualização administrativa.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="knowledge-title">Titulo</Label>

              <Input
                id="knowledge-title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="h-10 rounded-lg"
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
                <SelectTrigger className="h-10 w-full rounded-lg">
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
                className="h-10 rounded-lg"
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
                  setForm((current) => ({
                    ...current,
                    excerpt: event.target.value,
                  }))
                }
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="knowledge-content">Conteudo</Label>

              <Textarea
                id="knowledge-content"
                rows={10}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                className="rounded-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!uploading) {
            setUploadDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-xl p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>Enviar arquivo</DialogTitle>

            <DialogDescription>
              Adicione um arquivo à base de conhecimento. Após o envio, o
              O arquivo será armazenado e indexado de forma incremental para
              disponibilizar seu conteúdo ao agente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 px-5 py-5">
            <div className="space-y-2">
              <Label>Categoria</Label>

              <Select
                value={uploadCategory}
                onValueChange={(value) =>
                  setUploadCategory(value as KnowledgeCategory)
                }
                disabled={uploading}
              >
                <SelectTrigger className="h-10 w-full rounded-lg">
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
              <Label htmlFor="knowledge-file">Arquivo</Label>

              <Input
                id="knowledge-file"
                type="file"
                accept=".txt,.md,.pdf,.docx,.csv,.xlsx"
                disabled={uploading}
                onChange={(event) =>
                  setUploadFile(event.target.files?.[0] ?? null)
                }
                className="h-11 cursor-pointer rounded-lg"
              />

              <p className="text-xs leading-5 text-muted-foreground">
                Formatos aceitos: TXT, MD, PDF, DOCX, CSV e XLSX. Tamanho
                máximo: 15 MB.
              </p>
            </div>

            {uploadFile ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  {uploadFile.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : null}

            {uploading ? (
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Enviando arquivo e processando seu conteúdo...
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile}
            >
              {uploading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileUp className="size-4" />
                  Enviar arquivo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
