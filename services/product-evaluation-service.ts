import { Prisma } from "@prisma/client";
import { z } from "zod";
import { productEvaluationQuestions } from "@/lib/product-evaluation";
import { prisma } from "@/lib/prisma";

const productEvaluationSchema = z.object({
  easeOfUse: z.number().int().min(1).max(5),
  relevance: z.number().int().min(1).max(5),
  responseTime: z.number().int().min(1).max(5),
  reuseIntent: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2_000).optional(),
});

export type ProductEvaluationInput = z.infer<typeof productEvaluationSchema>;

export async function getProductEvaluationStatus(userId: string) {
  const client = prisma;

  if (!client) {
    return { eligible: false, answered: true };
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      feedbackEligible: true,
      feedbackCampaign: true,
    },
  });

  const evaluation = user
    ? await client.productEvaluationResponse.findUnique({
        where: {
          userId_campaign: {
            userId,
            campaign: user.feedbackCampaign,
          },
        },
        select: { id: true },
      })
    : null;

  return {
    eligible: user?.feedbackEligible ?? false,
    answered: Boolean(evaluation),
  };
}

export async function submitProductEvaluation(
  userId: string,
  input: unknown,
) {
  const data = productEvaluationSchema.parse(input);
  const client = prisma;

  if (!client) {
    throw new Error("A avaliação requer o banco de dados configurado.");
  }

  const status = await getProductEvaluationStatus(userId);

  if (!status.eligible) {
    throw new Error("Esta avaliação não está disponível para a sua conta.");
  }

  if (status.answered) {
    throw new Error("Esta avaliação já foi respondida.");
  }

  try {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { feedbackCampaign: true },
    });

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    return await client.productEvaluationResponse.create({
      data: {
        userId,
        campaign: user.feedbackCampaign,
        easeOfUse: data.easeOfUse,
        relevance: data.relevance,
        responseTime: data.responseTime,
        reuseIntent: data.reuseIntent,
        comment: data.comment || null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Esta avaliação já foi respondida.");
    }

    throw error;
  }
}

export async function getProductEvaluationSummary() {
  const client = prisma;

  if (!client) {
    return {
      invitedCount: 0,
      responseCount: 0,
      averages: productEvaluationQuestions.map((question) => ({
        key: question.key,
        label: question.title,
        value: null,
      })),
      responses: [],
    };
  }

  const [invitedCount, records] = await client.$transaction([
    client.user.count({ where: { feedbackEligible: true } }),
    client.productEvaluationResponse.findMany({
      include: {
        user: {
          select: { name: true, email: true, feedbackCampaign: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeRecords = records.filter(
    (response) => response.campaign === response.user.feedbackCampaign,
  );
  const responseCount = activeRecords.length;
  const totals = activeRecords.reduce(
    (current, response) => ({
      easeOfUse: current.easeOfUse + response.easeOfUse,
      relevance: current.relevance + response.relevance,
      responseTime: current.responseTime + response.responseTime,
      reuseIntent: current.reuseIntent + response.reuseIntent,
    }),
    { easeOfUse: 0, relevance: 0, responseTime: 0, reuseIntent: 0 },
  );

  return {
    invitedCount,
    responseCount,
    averages: productEvaluationQuestions.map((question) => ({
      key: question.key,
      label: question.title,
      value:
        responseCount === 0
          ? null
          : Number(
              (
                totals[question.key] /
                responseCount
              ).toFixed(1),
            ),
    })),
    responses: activeRecords.map((response) => ({
      id: response.id,
      userName: response.user.name,
      userEmail: response.user.email,
      easeOfUse: response.easeOfUse,
      relevance: response.relevance,
      responseTime: response.responseTime,
      reuseIntent: response.reuseIntent,
      comment: response.comment,
      createdAt: response.createdAt.toISOString(),
    })),
  };
}
