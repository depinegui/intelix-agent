import { NextResponse } from "next/server";
import { recoverPassword } from "@/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await recoverPassword(body);

    return NextResponse.json({
      ok: true,
      message: "Senha atualizada com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel redefinir a senha.",
      },
      { status: 400 },
    );
  }
}
