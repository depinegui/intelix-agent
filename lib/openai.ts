import OpenAI from "openai";
import { env, isOpenAiEnabled } from "@/lib/env";

const MISSING_OPENAI_KEY_MESSAGE =
  "A OPENAI_API_KEY nao esta configurada. Adicione a chave no arquivo .env e reinicie a aplicacao.";

export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

let client: OpenAI | null = null;

export function assertOpenAiConfigured() {
  if (!isOpenAiEnabled) {
    throw new Error(MISSING_OPENAI_KEY_MESSAGE);
  }
}

export function getOpenAiClient() {
  assertOpenAiConfigured();

  if (!client) {
    client = new OpenAI({
      apiKey: env.openAiKey,
    });
  }

  return client;
}

export function getOpenAiConfigurationMessage() {
  return MISSING_OPENAI_KEY_MESSAGE;
}
