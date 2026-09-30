import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ValidRoles } from '../interfaces/valid-roles';
import { RoleProtected } from './role-protected.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' }),
    // sin roles el endpoint solo exige estar autenticado: nunca responde 403
    ...(roles.length > 0
      ? [
          ApiForbiddenResponse({
            description: `The user needs one of these roles: ${roles.join(', ')}`,
          }),
        ]
      : []),
  );
}
