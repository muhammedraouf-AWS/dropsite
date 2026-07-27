import { prisma } from "@/lib/prisma";

export function listProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
