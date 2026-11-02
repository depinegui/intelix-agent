import assert from "node:assert/strict";
import test from "node:test";
import { IntelixSupportAgent, needsPromptClarification } from "./intelix-support-agent";

test("recognizes greetings and generic requests without swallowing technical questions", () => {
  for (const prompt of ["teste", "Olá!", "bom dia, tudo bem?", "preciso de ajuda", "testando 1 2 3", "???"]) {
    assert.equal(needsPromptClarification(prompt), true, prompt);
  }
  for (const prompt of ["NF-e", "markup", "erro 539", "oi, erro ao emitir nota", "teste de conexão com SEFAZ", "ajuda com markup", "539"]) {
    assert.equal(needsPromptClarification(prompt), false, prompt);
  }
});

test("generic messages ask for details without confidence or escalation eligibility", async () => {
  const reply = await new IntelixSupportAgent().respond({
    prompt: "teste",
    history: [],
    relatedDocuments: [],
  });
  assert.equal(reply.needsClarification, true);
  assert.equal(reply.confidence, undefined);
  assert.deepEqual(reply.citations, []);
  assert.match(reply.content, /Descreva sua dúvida/);
});

test("a technical question without sources retains the knowledge fallback", async () => {
  const reply = await new IntelixSupportAgent().respond({
    prompt: "Como resolver a rejeição 539?",
    history: [],
    relatedDocuments: [],
  });
  assert.equal(reply.needsClarification, undefined);
  assert.equal(reply.confidence, 18);
  assert.match(reply.content, /fornecer mais detalhes ou encaminhar/);
});
