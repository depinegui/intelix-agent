"use client";

import { startTransition, useState } from "react";
import {
  Bot,
  History,
  LifeBuoy,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownMessage } from "@/components/chat/markdown-message";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import type {
  ChatConversationRecord,
  ChatCitation,
  MessageFeedback,
  ChatMessageRecord,
  ChatReply,
  TicketRecord,
} from "@/types";
import {
  categoryLabels,
  formatConversationTime,
  formatDateTime,
} from "@/utils/format";

const feedbackReasons = [
  { value: "INCORRECT", label: "A resposta esta incorreta" },
  { value: "INCOMPLETE", label: "A resposta esta incompleta" },
  { value: "NOT_ANSWERED", label: "A pergunta nao foi respondida" },
  { value: "INADEQUATE_SOURCE", label: "As fontes nao sao adequadas" },
  { value: "CONFUSING", label: "A resposta esta confusa" },
  { value: "OTHER", label: "Outro motivo" },
] as const;

type FeedbackReason = (typeof feedbackReasons)[number]["value"];

function citationOrigin(citation: ChatCitation) {
  if (citation.kind === "ticket") return "Historico de atendimento";
  if (citation.source?.startsWith("legacy:")) return "Base canonica";
  if (citation.source?.startsWith("upload:")) return "Arquivo enviado";
  if (citation.source?.startsWith("manual:")) return "Documento cadastrado";
  return "Base de conhecimento";
}

interface ChatViewProps {
  initialConversation: ChatConversationRecord | null;
  initialMessages: ChatMessageRecord[];
  initialConversations: ChatConversationRecord[];
}

export function ChatView({
  initialConversation,
  initialMessages,
  initialConversations,
}: ChatViewProps) {
  const [conversationId, setConversationId] = useState(
    initialConversation?.id ?? "",
  );
  const [messages, setMessages] = useState(initialMessages);
  const [conversations, setConversations] = useState(initialConversations);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [openingConversationId, setOpeningConversationId] = useState("");
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState("");
  const [creatingTicketMessageId, setCreatingTicketMessageId] = useState("");
  const [feedbackDialogMessageId, setFeedbackDialogMessageId] = useState("");
  const [feedbackReason, setFeedbackReason] = useState<FeedbackReason>("INCORRECT");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [createdTicketsByMessage, setCreatedTicketsByMessage] = useState<
    Record<string, string>
  >({});

  const scrollRef = useAutoScroll<HTMLDivElement>(messages.length);

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "ASSISTANT");

  function updateConversation(conversation: ChatConversationRecord) {
    setConversations((current) =>
      [conversation, ...current.filter((item) => item.id !== conversation.id)].sort(
        (left, right) => right.updatedAt.localeCompare(left.updatedAt),
      ),
    );
  }

  function startNewConversation() {
    setConversationId("");
    setMessages([]);
    setPrompt("");
  }

  async function openConversation(id: string) {
    if (id === conversationId || openingConversationId) {
      return;
    }

    setOpeningConversationId(id);

    try {
      const conversationState = await apiRequest<{
        conversation: ChatConversationRecord;
        messages: ChatMessageRecord[];
      }>(`/api/chat/conversations/${id}`);

      setConversationId(conversationState.conversation.id);
      setMessages(conversationState.messages);
      setPrompt("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel abrir a conversa.",
      );
    } finally {
      setOpeningConversationId("");
    }
  }

  async function updateFeedback(
    messageId: string,
    currentFeedback: MessageFeedback | undefined,
    nextFeedback: MessageFeedback,
    detail?: { reason: FeedbackReason; comment: string },
  ) {
    if (updatingFeedbackId) {
      return;
    }

    const feedback =
      currentFeedback === nextFeedback ? undefined : nextFeedback;

    setUpdatingFeedbackId(messageId);

    try {
      const payload = await apiRequest<{ message: ChatMessageRecord }>(
        `/api/chat/messages/${messageId}/feedback`,
        {
          method: "PATCH",
          body: JSON.stringify({
            feedback: feedback ?? null,
            ...(feedback === "NOT_HELPFUL" && detail
              ? { reason: detail.reason, comment: detail.comment || undefined }
              : {}),
          }),
        },
      );

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? payload.message : message,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o feedback.",
      );
    } finally {
      setUpdatingFeedbackId("");
    }
  }

  async function createSupportTicket(message: ChatMessageRecord) {
    if (creatingTicketMessageId || createdTicketsByMessage[message.id]) {
      return;
    }

    setCreatingTicketMessageId(message.id);

    try {
      const payload = await apiRequest<{ ticket: TicketRecord; created: boolean }>(
        `/api/chat/messages/${message.id}/escalate`,
        {
          method: "POST",
        },
      );

      setCreatedTicketsByMessage((current) => ({
        ...current,
        [message.id]: payload.ticket.protocol,
      }));

      toast.success(payload.created
        ? `Chamado ${payload.ticket.protocol} criado para atendimento humano.`
        : `Este atendimento ja possui o chamado ${payload.ticket.protocol}.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel encaminhar para atendimento.",
      );
    } finally {
      setCreatingTicketMessageId("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim() || sending || openingConversationId) {
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
          updateConversation(payload.conversation);

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

  async function submitNotHelpfulFeedback() {
    if (!feedbackDialogMessageId) return;
    const message = messages.find((item) => item.id === feedbackDialogMessageId);
    if (!message) return;
    await updateFeedback(message.id, message.feedback, "NOT_HELPFUL", {
      reason: feedbackReason,
      comment: feedbackComment.trim(),
    });
    setFeedbackDialogMessageId("");
    setFeedbackComment("");
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-3">
        <section className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border bg-card shadow-[0_1px_2px_rgba(31,45,61,0.035)]">
            <CardHeader className="px-4 pt-4">
              <CardTitle className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Base de conhecimento
              </CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold text-foreground">Ativa</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Conteudos relevantes apoiam as respostas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="px-4 pt-4">
              <CardTitle className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Fontes recuperadas
              </CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold text-foreground">
                {sourceCount}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Referencias usadas na ultima resposta.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="px-4 pt-4">
              <CardTitle className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Confianca da resposta
              </CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold text-foreground">
                {confidence ? `${confidence}%` : "--"}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Indicador de aderencia ao contexto.
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <History className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                Conversas
              </CardTitle>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={startNewConversation}
              disabled={sending || Boolean(openingConversationId)}
            >
              <Plus className="size-4" />
              Nova conversa
            </Button>
          </CardHeader>

          <CardContent className="flex gap-2 overflow-x-auto px-5 py-3">
            {conversations.length ? (
              conversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  type="button"
                  variant={
                    conversation.id === conversationId
                      ? "secondary"
                      : "outline"
                  }
                  className="h-auto min-w-48 shrink-0 items-start rounded-lg px-3 py-2.5 text-left"
                  onClick={() => openConversation(conversation.id)}
                  disabled={sending || Boolean(openingConversationId)}
                >
                  <span className="grid gap-1">
                    <span className="max-w-44 truncate font-semibold">
                      {conversation.title}
                    </span>

                    <span className="text-xs font-normal text-muted-foreground">
                      {formatDateTime(conversation.updatedAt)}
                    </span>
                  </span>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Suas conversas aparecerao aqui depois da primeira mensagem.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent
            className={`flex flex-col px-0 pb-0 ${
              messages.length
                ? "h-[calc(100vh-330px)] min-h-[540px]"
                : "h-auto"
            }`}
          >
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5"
            >
              {messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/25 p-5 text-sm leading-6 text-muted-foreground">
                  Comece descrevendo uma dúvida operacional ou um erro
                  encontrado. As respostas serão orientadas pelo conteúdo
                  disponível na base de conhecimento.
                </div>
              ) : null}

              {messages.map((message) => {
                const assistant = message.role === "ASSISTANT";
                const createdTicketProtocol =
                  createdTicketsByMessage[message.id];

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      assistant ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] rounded-xl px-4 py-3.5 ${
                        assistant
                          ? "border border-border/80 bg-muted/55 text-foreground"
                          : "border border-primary/20 bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                        {assistant ? (
                          <Bot className="size-4" />
                        ) : (
                          <UserRound className="size-4" />
                        )}

                        {assistant ? "Intelix Agent" : "Voce"}
                      </div>

                      {assistant ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.content}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-4 text-xs opacity-70">
                        <span>
                          {formatConversationTime(message.createdAt)}
                        </span>

                        {assistant && message.confidence ? (
                          <span>Confianca {message.confidence}%</span>
                        ) : null}
                      </div>

                      {assistant && message.citations?.length ? (
                        <details className="mt-3 rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-xs">
                          <summary className="cursor-pointer font-medium text-foreground">
                            Fontes utilizadas ({message.citations.length})
                          </summary>
                          <div className="mt-2 grid gap-2">
                            {message.citations.map((citation) => (
                              <div key={citation.id} className="grid gap-0.5">
                                <span className="font-medium text-foreground">{citation.title}</span>
                                <span className="text-muted-foreground">
                                  {categoryLabels[citation.category]} · {citationOrigin(citation)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : null}

                      {assistant ? (
                        <div className="mt-3 flex flex-wrap items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              message.feedback === "HELPFUL"
                                ? "secondary"
                                : "ghost"
                            }
                            className="h-7 rounded-md px-2 text-xs"
                            onClick={() =>
                              updateFeedback(
                                message.id,
                                message.feedback,
                                "HELPFUL",
                              )
                            }
                            disabled={Boolean(updatingFeedbackId)}
                          >
                            <ThumbsUp className="size-3.5" />
                            Util
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant={
                              message.feedback === "NOT_HELPFUL"
                                ? "secondary"
                                : "ghost"
                            }
                            className="h-7 rounded-md px-2 text-xs"
                            onClick={() => {
                              if (message.feedback === "NOT_HELPFUL") {
                                void updateFeedback(message.id, message.feedback, "NOT_HELPFUL");
                                return;
                              }
                              setFeedbackReason("INCORRECT");
                              setFeedbackComment("");
                              setFeedbackDialogMessageId(message.id);
                            }}
                            disabled={Boolean(updatingFeedbackId)}
                          >
                            <ThumbsDown className="size-3.5" />
                            Nao util
                          </Button>

                          {message.withoutContext ? (
                            createdTicketProtocol ? (
                              <div className="ml-1 flex items-center gap-1.5 rounded-md border border-border bg-background/70 px-2.5 py-1 text-xs font-medium">
                                <LifeBuoy className="size-3.5 text-primary" />
                                Chamado {createdTicketProtocol}
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="ml-1 h-7 rounded-md px-2.5 text-xs"
                                onClick={() => createSupportTicket(message)}
                                disabled={Boolean(creatingTicketMessageId)}
                              >
                                {creatingTicketMessageId === message.id ? (
                                  <LoaderCircle className="size-3.5 animate-spin" />
                                ) : (
                                  <LifeBuoy className="size-3.5" />
                                )}

                                {creatingTicketMessageId === message.id
                                  ? "Encaminhando"
                                  : "Encaminhar para atendimento"}
                              </Button>
                            )
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-border/80 bg-muted/35 p-4"
            >
              <div className="grid gap-4">
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      if (!event.repeat) {
                        event.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                  rows={4}
                  className="min-h-24 rounded-lg border-border bg-background/75"
                  placeholder='Ex.: "Estou com erro ao emitir NF-e. Aparece a mensagem Rejeicao 539."'
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Enter para enviar · Shift + Enter para nova linha.
                  </p>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-10 rounded-lg px-5"
                    disabled={sending || Boolean(openingConversationId)}
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

      <div className="grid content-start gap-3">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/70 px-5 py-4">
            <CardTitle className="text-base font-semibold">
              Fontes utilizadas ({sourceCount})
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 px-5 py-4">
            {lastAssistantMessage?.citations?.length ? (
              lastAssistantMessage.citations.map((citation) => (
                <div
                  key={citation.id}
                  className="rounded-lg border border-border/70 bg-muted/35 p-3.5"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="size-4 text-primary" />
                    {citation.title}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {citation.excerpt}
                  </p>

                  <p className="mt-3 text-[10px] font-semibold tracking-[0.16em] text-primary/70 uppercase">
                    {citationOrigin(citation)} · {categoryLabels[citation.category]}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
                As referencias utilizadas aparecerão aqui quando houver conteúdo
                relevante para a resposta.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-[0_1px_2px_rgba(31,45,61,0.035)]">
          <CardHeader className="px-5 pt-4">
            <CardTitle className="text-base font-semibold">
              Atendimento assistido
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 px-5 pb-5 text-sm leading-6 text-muted-foreground">
            <p>Respostas orientadas pelos conteúdos disponíveis.</p>
            <p>
              Histórico da conversa mantido para dar continuidade ao atendimento.
            </p>
            <p>
              Informações sensíveis são tratadas com cuidado durante a conversa.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(feedbackDialogMessageId)}
        onOpenChange={(open) => {
          if (!open && !updatingFeedbackId) setFeedbackDialogMessageId("");
        }}
      >
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>Por que esta resposta nao foi util?</DialogTitle>
            <DialogDescription>
              Seu feedback ajuda a aprimorar as proximas respostas. Nao inclua dados sensiveis.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="feedback-reason">Motivo</Label>
              <Select value={feedbackReason} onValueChange={(value) => setFeedbackReason(value as FeedbackReason)}>
                <SelectTrigger id="feedback-reason" className="w-full rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {feedbackReasons.map((reason) => <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback-comment">Comentario (opcional)</Label>
              <Textarea id="feedback-comment" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} maxLength={500} rows={4} placeholder="Conte brevemente o que faltou." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFeedbackDialogMessageId("")} disabled={Boolean(updatingFeedbackId)}>Cancelar</Button>
            <Button type="button" onClick={() => void submitNotHelpfulFeedback()} disabled={Boolean(updatingFeedbackId)}>
              {updatingFeedbackId ? "Enviando..." : "Enviar feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
