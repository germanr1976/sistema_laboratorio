import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '@/config/logger';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    const id = randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    req.log = logger.child({ requestId: id });
    next();
}
