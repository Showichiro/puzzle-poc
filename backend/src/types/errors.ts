import { HTTPException } from "hono/http-exception";
import type { ErrorCode } from "./api";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class PuzzlePocError extends HTTPException {
  constructor(
    message: string,
    public code: ErrorCode,
    status: ContentfulStatusCode = 400,
  ) {
    super(status, { message });
  }
}
