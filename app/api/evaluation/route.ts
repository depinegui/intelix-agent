import { NextResponse } from "next/server";
import { safeRouteError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/session";
import {
  getProductEvaluationStatus,
  submitProductEvaluation,
} from "@/services/product-evaluation-service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  return NextResponse.json(await getProductEvaluationStatus(user.id));
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  try {
    const response = await submitProductEvaluation(user.id, await request.json());
    return NextResponse.json({ id: response.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: safeRouteError(error, "Nao foi possivel enviar a avaliação.") },
      { status: 400 },
    );
  }
}
