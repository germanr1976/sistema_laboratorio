import { User, Profile, Role } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: User & {
                profile: Profile | null;
                role: Role;
            };
        }
    }
}