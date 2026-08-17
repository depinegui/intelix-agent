"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, CheckCircle2, SearchCode, Sparkles } from "lucide-react";
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

const categories = [
  { value: "NF_E", label: "NF-e" },
  { value: "NFC_E", label: "NFC-e" },
  { value: "ESTOQUE", label: "Estoque" },
  { value: "INVENTARIO", label: "Inventario" },
  { value: "PCP", label: "PCP" },
  { value: "FINANCEIRO", label: "Financeiro" },
];

const priorities = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Critica" },
];

interface NewTicketFormProps {
  protocolPreview: string;
}

export function NewTicketForm({ protocolPreview }: NewTicketFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState("NF_E");
  const [priority, setPriority] = useState("MEDIA");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setLoading(true);

    try {
      await apiRequest("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          protocol: String(formData.get("protocol") ?? ""),
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          category,
          priority,
        }),
      });

      toast.success("Chamado aberto com sucesso.");
      router.push("/chamados");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel abrir o chamado.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.42fr]">
      <form onSubmit={handleSubmit} className="surface-card space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ticket-title">Titulo do Chamado</Label>
            <Input
              id="ticket-title"
              name="title"
              className="h-12 rounded-2xl"
              placeholder="Ex: Erro na emissao de NF-e"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-protocol">Protocolo</Label>
            <Input
              id="ticket-protocol"
              name="protocol"
              className="h-12 rounded-2xl"
              placeholder={protocolPreview}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value ?? "NF_E")}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value ?? "MEDIA")}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-status">Status inicial</Label>
            <Input
              id="ticket-status"
              value="Aguardando abertura"
              className="h-12 rounded-2xl"
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-description">Descricao do Problema</Label>
          <Textarea
            id="ticket-description"
            name="description"
            rows={10}
            className="rounded-[24px]"
            placeholder="Descreva detalhadamente o problema encontrado, impacto no processo e evidencias ja coletadas."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            size="lg"
            className="h-12 rounded-2xl px-6"
            disabled={loading}
          >
            {loading ? "Abrindo..." : "Abrir Chamado"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 rounded-2xl px-6"
            onClick={() => router.push("/chamados")}
          >
            Cancelar
          </Button>
        </div>
      </form>

      <div className="grid gap-4">
        <div className="surface-card space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/12 p-3 text-primary">
              <Bot className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Triagem por IA</p>
              <p className="text-xl font-semibold text-foreground">
                Analise automatica inicial
              </p>
            </div>
          </div>
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Nosso agente inteligente vai analisar o chamado, consultar a base
              de conhecimento e propor uma resolucao inicial sempre que
              encontrar um caso conhecido.
            </p>
            <div className="rounded-[24px] border border-border/70 bg-muted/45 p-4">
              <div className="flex items-start gap-3">
                <SearchCode className="mt-1 size-4 text-primary" />
                <span>Busca de solucoes similares em historico de chamados.</span>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <Sparkles className="mt-1 size-4 text-primary" />
                <span>Sugestao de resposta e categorizacao de prioridade.</span>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <CheckCircle2 className="mt-1 size-4 text-primary" />
                <span>Encaminhamento ao especialista se o caso exigir.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
