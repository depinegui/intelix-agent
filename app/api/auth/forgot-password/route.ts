import { NextResponse } from "next/server";
export async function POST() {
  // Nao existe provedor de e-mail/token configurado. Alterar senha apenas com
  // e-mail permitiria tomada de conta, por isso a recuperacao fica desativada.
  return NextResponse.json(
    {
      message:
        "Recuperacao de senha indisponivel. Solicite atendimento ao administrador.",
    },
    { status: 503 },
  );
}
