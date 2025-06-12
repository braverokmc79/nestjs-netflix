import { Reflector } from "@nestjs/core";
import { Role } from "src/users/entity/user.entity";

export const RBAC = Reflector.createDecorator<Role>();