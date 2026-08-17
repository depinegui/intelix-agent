const REDACTION_RULES: Array<[RegExp, string]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]"],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]"],
  [/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "[CNPJ]"],
  [/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, "[TELEFONE]"],
  [/\b\d{44}\b/g, "[CHAVE_NFE]"],
];

export function redactSensitiveData(input: string) {
  return REDACTION_RULES.reduce(
    (content, [pattern, replacement]) => content.replace(pattern, replacement),
    input,
  );
}
