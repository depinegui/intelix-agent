import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import {
  auditActions,
  auditEntityTypes,
  listAuditLogs,
} from "@/services/audit-service";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(25).default(25),
  user: z.string().cuid().optional(),
  action: z.enum(auditActions).optional(),
  entityType: z.enum(auditEntityTypes).optional(),
  q: z.string().trim().max(120).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "VIEW_AUDIT")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json({ message: "Filtros de auditoria invalidos." }, { status: 400 });
  }

  const data = parsed.data;
  const from = data.from ? new Date(`${data.from}T00:00:00.000`) : undefined;
  const to = data.to ? new Date(`${data.to}T23:59:59.999`) : undefined;

  if (from && to && from > to) {
    return NextResponse.json({ message: "O periodo informado e invalido." }, { status: 400 });
  }

  try {
    const result = await listAuditLogs({
      page: data.page,
      pageSize: data.pageSize,
      user: data.user,
      action: data.action,
      entityType: data.entityType,
      query: data.q,
      from,
      to,
    });
    return NextResponse.json({ ...result, page: data.page, pageSize: data.pageSize });
  } catch (error) {
    console.error("Falha ao consultar auditoria.", error);
    return NextResponse.json({ message: "Nao foi possivel consultar a auditoria." }, { status: 500 });
  }
}
