import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/users/schema/user.schema';

export const RBAC_KEY = 'roles';
export const RBAC = (...roles: Role[]) => SetMetadata(RBAC_KEY, roles);
