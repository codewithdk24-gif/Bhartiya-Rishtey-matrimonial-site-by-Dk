
/**
 * Standardized Logger for Production Traceability
 */
export const logger = {
  info: (msg: string | any, context: Record<string, any> = {}) => {
    const isObj = typeof msg !== 'string';
    const message = isObj ? (msg.message || "No message") : msg;
    const finalContext = isObj ? { ...msg, ...context } : context;
    if (isObj) delete (finalContext as any).message;

    console.log(JSON.stringify({
      level: "INFO",
      timestamp: new Date().toISOString(),
      message,
      ...finalContext
    }));
  },

  error: (msg: string | any, error: any, context: Record<string, any> = {}) => {
    const isObj = typeof msg !== 'string';
    const message = isObj ? (msg.message || "No message") : msg;
    const finalContext = isObj ? { ...msg, ...context } : context;
    if (isObj) delete (finalContext as any).message;

    console.error(JSON.stringify({
      level: "ERROR",
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      ...finalContext
    }));
  },

  warn: (msg: string | any, context: Record<string, any> = {}) => {
    const isObj = typeof msg !== 'string';
    const message = isObj ? (msg.message || "No message") : msg;
    const finalContext = isObj ? { ...msg, ...context } : context;
    if (isObj) delete (finalContext as any).message;

    console.warn(JSON.stringify({
      level: "WARN",
      timestamp: new Date().toISOString(),
      message,
      ...finalContext
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
