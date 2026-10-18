import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { getProductEvaluationSummary } from "@/services/product-evaluation-service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "VIEW_EVALUATIONS")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  return NextResponse.json(await getProductEvaluationSummary());
}
