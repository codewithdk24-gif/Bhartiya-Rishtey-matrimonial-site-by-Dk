import { crypto } from "node:crypto";

/**
 * Standardized Logger for Production Traceability
 */
export const logger = {
  info: (message: string, context: Record<string, any> = {}) => {
    console.log(JSON.stringify({
      level: "INFO",
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },

  error: (message: string, error: any, context: Record<string, any> = {}) => {
    console.error(JSON.stringify({
      level: "ERROR",
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      ...context
    }));
  },

  warn: (message: string, context: Record<string, any> = {}) => {
    console.warn(JSON.stringify({
      level: "WARN",
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  }
};

/**
 * Standard logAction for audit trails
 */
export function logAction(data: {
  userId?: string;
  ip?: string;
  action: string;
  status?: string;
  details?: string;
}) {
  logger.info(`ACTION: ${data.action}`, data);
}

/**
 * Standard logError for production monitoring
 */
export function logError(data: {
  message: string;
  error: any;
  userId?: string;
  requestId?: string;
  context?: Record<string, any>;
}) {
  const { message, error, ...rest } = data;
  logger.error(message, error, rest);
}

/**
 * Generates a unique Request ID for traceability
 */
export function generateRequestId(): string {
  return (globalThis as any).crypto?.randomUUID() || Math.random().toString(36).substring(2, 15);
}
