import { IntelixSupportAgent } from "@/agents/intelix-support-agent";

const supportAgent = new IntelixSupportAgent();

export function getSupportAgent() {
  return supportAgent;
}
