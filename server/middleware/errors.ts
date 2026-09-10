import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (entity: string): ApiError => new ApiError(404, `${entity} introuvable.`);

// Wraps an async route handler so a rejected promise reaches the error middleware instead of
// crashing the process or hanging the request.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => unknown) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const errorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' ; ');
    res.status(400).json({ error: { message } });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: { message: 'Erreur interne du serveur.' } });
};
