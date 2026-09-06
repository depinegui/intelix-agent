import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Cadastro publico desabilitado. Solicite a criacao da conta a um administrador.",
    },
    { status: 403 },
  );
}