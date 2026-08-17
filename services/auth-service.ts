import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { demoStore } from "@/database/demo-store";
import { prisma } from "@/lib/prisma";
import type {
  DemoUserRecord,
  LoginInput,
  RecoveryInput,
  RegisterInput,
  SessionUser,
} from "@/types";
import { normalizeIdentifier } from "@/utils/format";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  document: z.string().min(11),
  phone: z.string().min(8),
  companyType: z.enum(["FISICA", "JURIDICA"]),
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
});

const recoverySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

function toSessionUser(user: DemoUserRecord | SessionUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    document: user.document,
    phone: user.phone,
    companyType: user.companyType,
    role: user.role,
  } satisfies SessionUser;
}

function findDemoUserByIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  return demoStore.users.find((user) => {
    if (user.email.toLowerCase() === identifier.toLowerCase()) {
      return true;
    }

    return normalizeIdentifier(user.document) === normalized;
  });
}

export async function getUserById(id: string) {
  if (prisma) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? toSessionUser(user) : null;
  }

  const user = demoStore.users.find((item) => item.id === id);
  return user ? toSessionUser(user) : null;
}

export async function registerUser(input: RegisterInput) {
  const data = registerSchema.parse(input);
  const passwordHash = await hash(data.password, 10);

  if (prisma) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { document: data.document },
        ],
      },
    });

    if (existingUser) {
      throw new Error("Ja existe uma conta com este e-mail ou documento.");
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        document: data.document,
        phone: data.phone,
        companyType: data.companyType,
      },
    });

    return toSessionUser(user);
  }

  const duplicate = demoStore.users.find(
    (user) =>
      user.email.toLowerCase() === data.email.toLowerCase() ||
      normalizeIdentifier(user.document) === normalizeIdentifier(data.document),
  );

  if (duplicate) {
    throw new Error("Ja existe uma conta com este e-mail ou documento.");
  }

  const now = new Date().toISOString();
  const createdUser: DemoUserRecord = {
    id: `usr_${crypto.randomUUID().slice(0, 8)}`,
    name: data.name,
    email: data.email.toLowerCase(),
    document: data.document,
    phone: data.phone,
    companyType: data.companyType,
    role: "ANALYST",
    passwordHash,
    createdAt: now,
    updatedAt: now,
    resetToken: null,
    resetTokenExpiresAt: null,
  };

  demoStore.users.unshift(createdUser);
  return toSessionUser(createdUser);
}

export async function loginUser(input: LoginInput) {
  const data = loginSchema.parse(input);

  if (prisma) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.identifier.toLowerCase() },
          { document: data.identifier },
        ],
      },
    });

    if (!user || !(await compare(data.password, user.passwordHash))) {
      throw new Error("Credenciais invalidas.");
    }

    return toSessionUser(user);
  }

  const user = findDemoUserByIdentifier(data.identifier);

  if (!user || !(await compare(data.password, user.passwordHash))) {
    throw new Error("Credenciais invalidas.");
  }

  return toSessionUser(user);
}

export async function recoverPassword(input: RecoveryInput) {
  const data = recoverySchema.parse(input);
  const passwordHash = await hash(data.password, 10);

  if (prisma) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new Error("Nenhum usuario encontrado para este e-mail.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return;
  }

  const user = demoStore.users.find(
    (item) => item.email.toLowerCase() === data.email.toLowerCase(),
  );

  if (!user) {
    throw new Error("Nenhum usuario encontrado para este e-mail.");
  }

  user.passwordHash = passwordHash;
  user.updatedAt = new Date().toISOString();
}
