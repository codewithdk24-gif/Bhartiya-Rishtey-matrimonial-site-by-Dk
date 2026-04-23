import { NextResponse } from "next/server";

export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UPGRADE_REQUIRED = "UPGRADE_REQUIRED",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details: any = null,
  requestId: string | null = null
) {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export const ErrorResponses = {
  unauthorized: (requestId?: string) => 
    createErrorResponse("Authentication required", 401, ErrorCode.UNAUTHORIZED, null, requestId),
    
  forbidden: (msgOrRequestId = "Access denied", requestId?: string) => {
    if (requestId) return createErrorResponse(msgOrRequestId, 403, ErrorCode.FORBIDDEN, null, requestId);
    return createErrorResponse(msgOrRequestId, 403, ErrorCode.FORBIDDEN);
  },
  
  badRequest: (msg: string, details?: any, requestId?: string) => 
    createErrorResponse(msg, 400, ErrorCode.BAD_REQUEST, details, requestId),
    
  notFound: (requestIdOrMsg = "Resource not found", msg?: string) => {
    if (msg) return createErrorResponse(msg, 404, ErrorCode.NOT_FOUND, null, requestIdOrMsg);
    return createErrorResponse(requestIdOrMsg, 404, ErrorCode.NOT_FOUND);
  },
  
  rateLimited: (msg = "Too many requests", requestId?: string) => 
    createErrorResponse(msg, 429, ErrorCode.RATE_LIMITED, null, requestId),
    
  internal: (msgOrRequestId = "An unexpected error occurred", requestId?: string) => {
    if (requestId) return createErrorResponse(msgOrRequestId, 500, ErrorCode.INTERNAL_ERROR, null, requestId);
    return createErrorResponse(msgOrRequestId, 500, ErrorCode.INTERNAL_ERROR);
  },
  
  internalError: (requestId?: string) => 
    createErrorResponse("An unexpected error occurred", 500, ErrorCode.INTERNAL_ERROR, null, requestId),
    
  serviceUnavailable: (msg = "Service temporarily unavailable. Please try again later.", requestId?: string) => 
    createErrorResponse(msg, 503, ErrorCode.SERVICE_UNAVAILABLE, null, requestId),
};
