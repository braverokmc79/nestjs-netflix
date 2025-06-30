// import { Reflector } from "@nestjs/core";

// // import { Role } from "src/users/entity/user.entity";
// import { Role } from 'src/common/prisma.service';
// export const RBAC = Reflector.createDecorator<Role>();

// src/common/decorator/rbac.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/common/prisma.service'; // 혹은 @prisma/client

export const RBAC_KEY = 'roles';
export const RBAC = (...roles: Role[]) => SetMetadata(RBAC_KEY, roles);
