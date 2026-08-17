"use client";

import { startTransition, useState } from "react";
import { Bot, LoaderCircle, Send, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import type {
  ChatConversationRecord,
  ChatMessageRecord,
  ChatReply,
} from "@/types";
import { formatConversationTime } from "@/utils/format";

interface ChatViewProps {
  initialConversation: ChatConversationRecord | null;
  initialMessages: ChatMessageRecord[];
}

export function ChatView({
  initialConversation,
  initialMessages,
}: ChatViewProps) {
  const [conversationId, setConversationId] = useState(
    initialConversation?.id ?? "",
  );
  const [messages, setMessages] = useState(initialMessages);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useAutoScroll<HTMLDivElement>(messages.length);
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "ASSISTANT");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    const draftPrompt = prompt.trim();
    const optimisticMessage: ChatMessageRecord = {
      id: `draft_${crypto.randomUUID().slice(0, 8)}`,
      conversationId: conversationId || "draft",
      role: "USER",
      content: draftPrompt,
      createdAt: new Date().toISOString(),
    };

    setPrompt("");
    setMessages((current) => [...current, optimisticMessage]);
    setSending(true);

    startTransition(() => {
      apiRequest<ChatReply>("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          message: draftPrompt,
        }),
      })
        .then((payload) => {
          setConversationId(payload.conversationId);
          setMessages((current) => [
            ...current.filter((item) => item.id !== optimisticMessage.id),
            payload.userMessage ?? optimisticMessage,
            payload.message,
          ]);
        })
        .catch((error) => {
          setMessages((current) =>
            current.filter((item) => item.id !== optimisticMessage.id),
          );
          toast.error(
            error instanceof Error
              ? error.message
              : "Nao foi possivel consultar o agente.",
          );
        })
        .finally(() => {
          setSending(false);
        });
    });
  }

  const sourceCount = lastAssistantMessage?.citations?.length ?? 0;
  const confidence = lastAssistantMessage?.confidence ?? 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-4">
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[28px] border-none bg-[#f4fbfc] shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Contexto RAG
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-3xl font-semibold text-foreground">Ativo</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Recuperacao vetorial dos documentos indexados em /knowledge.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Fontes recuperadas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-3xl font-semibold text-foreground">
                {sourceCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Trechos recuperados da base de conhecimento para esta resposta.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Confianca da resposta
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-3xl font-semibold text-foreground">
                {confidence ? `${confidence}%` : "--"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Score baseado em aderencia ao contexto recuperado.
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-[30px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
          <CardContent className="flex h-[640px] flex-col px-0 pb-0">
            <div
              ref={scrollRef}
              className="flex-1 space-y-6 overflow-y-auto px-6 py-6"
            >
              {messages.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground">
                  Inicie a conversa com um erro de ERP, rejeicao fiscal ou
                  duvida operacional. O agente vai consultar a base indexada e
                  responder apenas com o que encontrar nela.
                </div>
              ) : null}

              {messages.map((message) => {
                const assistant = message.role === "ASSISTANT";
                return (
                  <div
                    key={message.id}
                    className={`flex ${assistant ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[86%] rounded-[28px] px-5 py-4 ${
                        assistant
                          ? "bg-muted/55 text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] opacity-70">
                        {assistant ? (
                          <Bot className="size-4" />
                        ) : (
                          <UserRound className="size-4" />
                        )}
                        {assistant ? "Intelix Agent" : "Voce"}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-4 text-xs opacity-70">
                        <span>{formatConversationTime(message.createdAt)}</span>
                        {assistant && message.confidence ? (
                          <span>Confianca {message.confidence}%</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-border/70 bg-muted/35 p-5"
            >
              <div className="grid gap-4">
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={4}
                  className="rounded-[24px] border-white/70 bg-white"
                  placeholder='Ex.: "Estou com erro ao emitir NF-e. Aparece a mensagem Rejeicao 539."'
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Se a base ainda nao estiver indexada, execute npm run
                    index:knowledge.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 rounded-2xl px-6"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Consultando
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Enviar para IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="rounded-[30px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl font-semibold">
              Fontes recuperadas para esta conversa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {lastAssistantMessage?.citations?.length ? (
              lastAssistantMessage.citations.map((citation) => (
                <div
                  key={citation.id}
                  className="rounded-[24px] border border-border/70 bg-muted/45 p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="size-4 text-primary" />
                    {citation.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {citation.excerpt}
                  </p>
                  {citation.source ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Arquivo: {citation.source}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs tracking-[0.2em] text-primary/70 uppercase">
                    {citation.kind === "knowledge"
                      ? "Base de conhecimento"
                      : "Historico do cliente"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
                As fontes aparecem aqui sempre que o agente localizar trechos
                relevantes na base indexada.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-none bg-[#f4fbfc] shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl font-semibold">
              Estrutura de IA preparada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6 text-sm leading-7 text-muted-foreground">
            <p>OpenAI SDK conectado ao endpoint dedicado do agente.</p>
            <p>Indexacao local com embeddings e busca por similaridade.</p>
            <p>Persistencia segura com redacao de dados sensiveis na conversa.</p>
            <p>Estrutura preparada para evoluir de arquivo local para pgvector.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
