import type { Logger } from 'pino';

interface RequestRole {
    name: string;
}

interface RequestProfile {
    firstName: string;
    lastName: string;
    birthDate?: Date | null;
}

interface RequestUser {
    id: number;
    dni: string;
    roleId: number;
    tenantId: number;
    isPlatformAdmin: boolean;
    email?: string | null;
    password?: string | null;
    role: RequestRole;
    profile?: RequestProfile | null;
}

interface RequestTenant {
    id: number;
    name: string;
    slug: string;
    suspended: boolean;
}

declare global {
    namespace Express {
        interface Request {
            id: string;
            log: Logger;
            user?: RequestUser;
            tenantId?: number;
            tenant?: RequestTenant;
        }
    }
}

export { };
