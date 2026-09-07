import { z } from "zod";

export function safeRouteError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return "Dados informados invalidos.";
  }

  // Erros detalhados podem conter nomes de tabelas, caminhos ou informacoes do
  // provedor. Em desenvolvimento eles continuam visiveis para diagnostico.
  return process.env.NODE_ENV === "production" ? fallback : error instanceof Error ? error.message : fallback;
}
