export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const isFormData = init?.body instanceof FormData;

  const response = await fetch(input, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ?? "Nao foi possivel concluir a requisicao.",
    );
  }

  return payload as T;
}