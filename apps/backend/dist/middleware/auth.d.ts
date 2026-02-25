import { Request, Response, NextFunction } from 'express';
import { Role } from '@aspire/db';
export declare const JWT_SECRET: string;
export declare function signToken(userId: string, role: Role): string;
export interface JwtPayload {
    sub: string;
    role?: Role;
    iat?: number;
    exp?: number;
}
export interface AuthRequest extends Request {
    userId?: string;
    userRole?: Role;
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireRole(...roles: Role[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
