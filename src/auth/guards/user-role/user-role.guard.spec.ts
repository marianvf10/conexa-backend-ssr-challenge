import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleProtected } from '../../decorators/role-protected.decorator';
import { ValidRoles } from '../../interfaces/valid-roles';
import { UserRoleGuard } from './user-role.guard';

// Controladores de ejemplo para probar la lectura real de metadatos
class PublicController {
  open() {}
}

class AuthenticatedOnlyController {
  @RoleProtected()
  anyUser() {}
}

class SingleRoleController {
  @RoleProtected(ValidRoles.admin)
  adminOnly() {}

  @RoleProtected(ValidRoles.admin, ValidRoles.user)
  adminOrUser() {}
}

@RoleProtected(ValidRoles.admin)
class AdminClassController {
  inheritsClassRole() {}

  @RoleProtected(ValidRoles.user)
  overridesClassRole() {}
}

describe('UserRoleGuard', () => {
  let guard: UserRoleGuard;

  beforeEach(() => {
    guard = new UserRoleGuard(new Reflector());
  });

  const contextFor = (
    controller: new () => object,
    method: string,
    user?: { fullname: string; roles: string[] },
  ) =>
    ({
      getHandler: () => controller.prototype[method],
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const admin = { fullname: 'Admin', roles: [ValidRoles.admin] };
  const regularUser = { fullname: 'Regular', roles: [ValidRoles.user] };

  it('deja pasar si el endpoint no define roles', () => {
    const context = contextFor(PublicController, 'open', regularUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deja pasar a cualquier usuario autenticado si la lista de roles esta vacia', () => {
    const context = contextFor(AuthenticatedOnlyController, 'anyUser', regularUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deja pasar al usuario que tiene el rol exigido', () => {
    const context = contextFor(SingleRoleController, 'adminOnly', admin);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('responde 403 si el usuario no tiene el rol exigido', () => {
    const context = contextFor(SingleRoleController, 'adminOnly', regularUser);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('indica en el mensaje del 403 los roles necesarios', () => {
    const context = contextFor(SingleRoleController, 'adminOnly', regularUser);

    expect(() => guard.canActivate(context)).toThrow(/admin/);
  });

  it('deja pasar si el usuario tiene al menos uno de varios roles permitidos', () => {
    const context = contextFor(SingleRoleController, 'adminOrUser', regularUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('responde 400 si no hay usuario en la request (guard usado sin autenticacion)', () => {
    const context = contextFor(SingleRoleController, 'adminOnly', undefined);

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });

  describe('roles definidos en la clase del controlador', () => {
    it('se aplican a los metodos que no definen los suyos', () => {
      const asAdmin = contextFor(AdminClassController, 'inheritsClassRole', admin);
      const asUser = contextFor(
        AdminClassController,
        'inheritsClassRole',
        regularUser,
      );

      expect(guard.canActivate(asAdmin)).toBe(true);
      expect(() => guard.canActivate(asUser)).toThrow(ForbiddenException);
    });

    it('el rol del metodo tiene prioridad sobre el de la clase', () => {
      const asUser = contextFor(
        AdminClassController,
        'overridesClassRole',
        regularUser,
      );
      const asAdmin = contextFor(AdminClassController, 'overridesClassRole', admin);

      expect(guard.canActivate(asUser)).toBe(true);
      expect(() => guard.canActivate(asAdmin)).toThrow(ForbiddenException);
    });
  });
});
