import { prisma } from '@aspire/db';

export async function auditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata: metadata as object },
  });
}
