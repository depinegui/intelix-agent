export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "intelix-dev-secret-change-me",
  openAiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
};

export const isDatabaseEnabled = env.databaseUrl.length > 0;
export const isOpenAiEnabled = env.openAiKey.length > 0;
