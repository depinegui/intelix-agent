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
  UserRole,
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

const adminCreateUserSchema = registerSchema.extend({
  role: z.enum(["ANALYST", "SPECIALIST"]),
});

const adminUpdateUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  document: z.string().min(11),
  phone: z.string().min(8),
  companyType: z.enum(["FISICA", "JURIDICA"]),
  role: z.enum(["ANALYST", "SPECIALIST"]),
});

const profileUpdateSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  document: z.string().min(11),
  phone: z.string().min(8),
  companyType: z.enum(["FISICA", "JURIDICA"]),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
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
      where: { id, isActive: true },
    });

    return user ? toSessionUser(user) : null;
  }

  const user = demoStore.users.find(
    (item) => item.id === id && item.isActive,
  );

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
      normalizeIdentifier(user.document) ===
        normalizeIdentifier(data.document),
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
    isActive: true,
    lastLoginAt: null,
  };

  demoStore.users.unshift(createdUser);

  return toSessionUser(createdUser);
}

export async function createUserByAdmin(input: {
  name: string;
  email: string;
  password: string;
  document: string;
  phone: string;
  companyType: "FISICA" | "JURIDICA";
  role: Extract<UserRole, "ANALYST" | "SPECIALIST">;
}) {
  const data = adminCreateUserSchema.parse(input);
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
        role: data.role,
      },
    });

    return toSessionUser(user);
  }

  const duplicate = demoStore.users.find(
    (user) =>
      user.email.toLowerCase() === data.email.toLowerCase() ||
      normalizeIdentifier(user.document) ===
        normalizeIdentifier(data.document),
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
    role: data.role,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    resetToken: null,
    resetTokenExpiresAt: null,
    isActive: true,
    lastLoginAt: null,
  };

  demoStore.users.unshift(createdUser);

  return toSessionUser(createdUser);
}

export async function listUsers() {
  if (prisma) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        companyType: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    }));
  }

  return [...demoStore.users]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      document: user.document,
      phone: user.phone,
      companyType: user.companyType,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }));
}

export async function updateUserByAdmin(
  targetUserId: string,
  currentUserId: string,
  input: {
    name: string;
    email: string;
    document: string;
    phone: string;
    companyType: "FISICA" | "JURIDICA";
    role: Extract<UserRole, "ANALYST" | "SPECIALIST">;
  },
) {
  if (targetUserId === currentUserId) {
    throw new Error(
      "Use o perfil pessoal para alterar os dados da sua propria conta.",
    );
  }

  const data = adminUpdateUserSchema.parse(input);

  if (prisma) {
    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new Error("Usuario nao encontrado.");
    }

    if (targetUser.role === "ADMIN") {
      throw new Error("Contas de administrador nao podem ser alteradas aqui.");
    }

    const duplicate = await prisma.user.findFirst({
      where: {
        id: {
          not: targetUserId,
        },
        OR: [
          {
            email: data.email.toLowerCase(),
          },
          {
            document: data.document,
          },
        ],
      },
    });

    if (duplicate) {
      throw new Error(
        "Ja existe outra conta com este e-mail ou documento.",
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        document: data.document,
        phone: data.phone,
        companyType: data.companyType,
        role: data.role,
      },
    });

    return {
      user: toSessionUser(updatedUser),
      previousRole: targetUser.role,
    };
  }

  const targetUser = demoStore.users.find(
    (user) => user.id === targetUserId,
  );

  if (!targetUser) {
    throw new Error("Usuario nao encontrado.");
  }

  if (targetUser.role === "ADMIN") {
    throw new Error("Contas de administrador nao podem ser alteradas aqui.");
  }

  const duplicate = demoStore.users.find(
    (user) =>
      user.id !== targetUserId &&
      (user.email.toLowerCase() === data.email.toLowerCase() ||
        normalizeIdentifier(user.document) ===
          normalizeIdentifier(data.document)),
  );

  if (duplicate) {
    throw new Error(
      "Ja existe outra conta com este e-mail ou documento.",
    );
  }

  const previousRole = targetUser.role;
  targetUser.name = data.name;
  targetUser.email = data.email.toLowerCase();
  targetUser.document = data.document;
  targetUser.phone = data.phone;
  targetUser.companyType = data.companyType;
  targetUser.role = data.role;
  targetUser.updatedAt = new Date().toISOString();

  return {
    user: toSessionUser(targetUser),
    previousRole,
  };
}

export async function updateOwnProfile(
  currentUserId: string,
  input: {
    name: string;
    email: string;
    document: string;
    phone: string;
    companyType: "FISICA" | "JURIDICA";
  },
) {
  const data = profileUpdateSchema.parse(input);

  if (prisma) {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
    });

    if (!currentUser) {
      throw new Error("Usuario nao encontrado.");
    }

    const duplicate = await prisma.user.findFirst({
      where: {
        id: {
          not: currentUserId,
        },
        OR: [
          {
            email: data.email.toLowerCase(),
          },
          {
            document: data.document,
          },
        ],
      },
    });

    if (duplicate) {
      throw new Error(
        "Ja existe outra conta com este e-mail ou documento.",
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        document: data.document,
        phone: data.phone,
        companyType: data.companyType,
      },
    });

    return toSessionUser(updatedUser);
  }

  const currentUser = demoStore.users.find(
    (user) => user.id === currentUserId,
  );

  if (!currentUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const duplicate = demoStore.users.find(
    (user) =>
      user.id !== currentUserId &&
      (user.email.toLowerCase() === data.email.toLowerCase() ||
        normalizeIdentifier(user.document) ===
          normalizeIdentifier(data.document)),
  );

  if (duplicate) {
    throw new Error(
      "Ja existe outra conta com este e-mail ou documento.",
    );
  }

  currentUser.name = data.name;
  currentUser.email = data.email.toLowerCase();
  currentUser.document = data.document;
  currentUser.phone = data.phone;
  currentUser.companyType = data.companyType;
  currentUser.updatedAt = new Date().toISOString();

  return toSessionUser(currentUser);
}

export async function setUserActiveByAdmin(
  targetUserId: string,
  currentUserId: string,
  isActive: boolean,
) {
  if (targetUserId === currentUserId) {
    throw new Error("Voce nao pode alterar o status da sua propria conta.");
  }

  if (prisma) {
    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new Error("Usuario nao encontrado.");
    }

    if (targetUser.role === "ADMIN") {
      throw new Error("Contas de administrador nao podem ter o status alterado aqui.");
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: { isActive },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    };
  }

  const targetUser = demoStore.users.find(
    (user) => user.id === targetUserId,
  );

  if (!targetUser) {
    throw new Error("Usuario nao encontrado.");
  }

  if (targetUser.role === "ADMIN") {
    throw new Error("Contas de administrador nao podem ter o status alterado aqui.");
  }

  targetUser.isActive = isActive;
  targetUser.updatedAt = new Date().toISOString();

  return {
    id: targetUser.id,
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    isActive: targetUser.isActive,
  };
}

export async function loginUser(input: LoginInput) {
  const data = loginSchema.parse(input);

  if (prisma) {
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          { email: data.identifier.toLowerCase() },
          { document: data.identifier },
        ],
      },
    });

    if (!user || !(await compare(data.password, user.passwordHash))) {
      throw new Error("Credenciais invalidas.");
    }

    const loggedInUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return toSessionUser(loggedInUser);
  }

  const user = findDemoUserByIdentifier(data.identifier);

  if (
    !user ||
    !user.isActive ||
    !(await compare(data.password, user.passwordHash))
  ) {
    throw new Error("Credenciais invalidas.");
  }

  user.lastLoginAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();

  return toSessionUser(user);
}

export async function changeOwnPassword(
  currentUserId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const data = passwordChangeSchema.parse(input);

  if (prisma) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, passwordHash: true, isActive: true },
    });

    if (!currentUser || !currentUser.isActive) {
      throw new Error("Usuario nao encontrado.");
    }

    if (!(await compare(data.currentPassword, currentUser.passwordHash))) {
      throw new Error("A senha atual esta incorreta.");
    }

    await prisma.user.update({
      where: { id: currentUserId },
      data: { passwordHash: await hash(data.newPassword, 10) },
    });

    return;
  }

  const currentUser = demoStore.users.find(
    (user) => user.id === currentUserId && user.isActive,
  );

  if (!currentUser) {
    throw new Error("Usuario nao encontrado.");
  }

  if (!(await compare(data.currentPassword, currentUser.passwordHash))) {
    throw new Error("A senha atual esta incorreta.");
  }

  currentUser.passwordHash = await hash(data.newPassword, 10);
  currentUser.updatedAt = new Date().toISOString();
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
