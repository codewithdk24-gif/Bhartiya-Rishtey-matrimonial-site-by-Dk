import { prisma } from './prisma';

type LogAction =
  | 'LOGIN_ATTEMPT'
  | 'REGISTER_ATTEMPT'
  | 'API_ERROR'
  | 'PAYMENT_SUBMITTED'
  | 'ADMIN_ACTION';

interface LoggerPayload {
  userId?: string;
  ip: string;
  action: LogAction;
  status: 'SUCCESS' | 'FAILURE';
  details?: string;
}

export async function logAction(payload: LoggerPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId ?? null,
        ip: payload.ip,
        action: payload.action,
        status: payload.status,
        details: payload.details ?? '',
      },
    });
  } catch (err) {
    // Logger should never crash the calling function
    console.error('AuditLog write failed:', err);
  }
}
