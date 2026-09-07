const isProduction = process.env.NODE_ENV === "production";
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

function requiredInProduction(name: string, value?: string) {
  if (isProduction && !isProductionBuild && !value) {
    throw new Error(`Configuracao obrigatoria ausente em producao: ${name}.`);
  }

  return value ?? "";
}

const jwtSecret = requiredInProduction("JWT_SECRET", process.env.JWT_SECRET);

if (isProduction && !isProductionBuild && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve ter ao menos 32 caracteres em producao.");
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: requiredInProduction("DATABASE_URL", process.env.DATABASE_URL),
  // O fallback so existe para a experiencia local sem banco. Nunca e aceito em producao.
  jwtSecret: jwtSecret || "intelix-local-development-session-secret",
  openAiKey: requiredInProduction("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
};

export const isDatabaseEnabled = env.databaseUrl.length > 0;
export const isOpenAiEnabled = env.openAiKey.length > 0;
