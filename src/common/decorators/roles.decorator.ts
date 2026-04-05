import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Marks a route as requiring one of the specified roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
