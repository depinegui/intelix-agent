"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  productEvaluationQuestions,
  type ProductEvaluationQuestionKey,
} from "@/lib/product-evaluation";
import { cn } from "@/lib/utils";

type Answers = Partial<Record<ProductEvaluationQuestionKey, number>>;

interface EvaluationStatus {
  eligible: boolean;
  answered: boolean;
}

export function ProductEvaluationGate() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const status = await apiRequest<EvaluationStatus>("/api/evaluation");

        if (active && status.eligible && !status.answered) {
          setOpen(true);
        }
      } catch (error) {
        console.error("Não foi possível verificar a avaliação pendente.", error);
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  const allQuestionsAnswered = productEvaluationQuestions.every(
    (question) => answers[question.key] !== undefined,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allQuestionsAnswered) {
      toast.error("Responda todas as perguntas de 1 a 5.");
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest("/api/evaluation", {
        method: "POST",
        body: JSON.stringify({ ...answers, comment }),
      });

      setOpen(false);
      toast.success("Obrigado! Sua avaliação foi registrada.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a avaliação.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-2rem)] max-w-3xl gap-0 overflow-y-auto p-0 sm:max-w-3xl"
      >
        <DialogHeader className="border-b border-border/70 px-5 py-5 md:px-7">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Star className="size-5" />
          </div>
          <DialogTitle className="mt-3 text-xl">Avaliação do Intelix Agent</DialogTitle>
          <DialogDescription className="max-w-2xl leading-6">
            Sua experiência utilizando o Intelix é muito importante para a
            avaliação e melhoria do projeto. Responda às perguntas abaixo com
            base nos testes realizados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-6 md:px-7">
          {productEvaluationQuestions.map((question, index) => (
            <fieldset key={question.key} className="space-y-3">
              <legend className="text-sm font-semibold leading-6 text-foreground">
                {index + 1}. {question.title}
              </legend>

              <div className="grid gap-2 sm:grid-cols-5">
                {question.options.map((label, optionIndex) => {
                  const score = optionIndex + 1;
                  const selected = answers[question.key] === score;

                  return (
                    <button
                      key={score}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.key]: score,
                        }))
                      }
                      className={cn(
                        "rounded-lg border px-2.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background hover:border-primary/50 hover:bg-muted/50",
                      )}
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                        {score}
                      </span>
                      <span className="mt-2 block text-xs leading-4 text-muted-foreground">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="space-y-3">
            <label htmlFor="product-evaluation-comment" className="text-sm font-semibold text-foreground">
              5. Deixe abaixo sugestões, críticas ou comentários que possam
              contribuir para a melhoria do Intelix Agent.
            </label>
            <Textarea
              id="product-evaluation-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={2_000}
              placeholder="Escreva aqui, se desejar."
              className="min-h-28 resize-y"
            />
            <p className="text-xs text-muted-foreground">Resposta opcional.</p>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Depois do envio, esta avaliação não será exibida novamente.
            </p>
            <Button type="submit" disabled={submitting || !allQuestionsAnswered}>
              <Send className="size-4" />
              {submitting ? "Enviando..." : "Enviar avaliação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
