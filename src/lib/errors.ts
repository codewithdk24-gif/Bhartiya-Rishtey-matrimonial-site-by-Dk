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
  unauthorized: () => createErrorResponse("Authentication required", 401, ErrorCode.UNAUTHORIZED),
  forbidden: (msg = "Access denied") => createErrorResponse(msg, 403, ErrorCode.FORBIDDEN),
  badRequest: (msg: string, details?: any) => createErrorResponse(msg, 400, ErrorCode.BAD_REQUEST, details),
  notFound: (msg = "Resource not found") => createErrorResponse(msg, 404, ErrorCode.NOT_FOUND),
  rateLimited: (msg = "Too many requests") => createErrorResponse(msg, 429, ErrorCode.RATE_LIMITED),
  internal: (msg = "An unexpected error occurred") => createErrorResponse(msg, 500, ErrorCode.INTERNAL_ERROR),
  serviceUnavailable: (msg = "Service temporarily unavailable. Please try again later.") => 
    createErrorResponse(msg, 503, ErrorCode.SERVICE_UNAVAILABLE),
};
