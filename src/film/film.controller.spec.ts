import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { META_ROLES } from '../auth/decorators/role-protected.decorator';
import { UserRoleGuard } from '../auth/guards/user-role/user-role.guard';
import { ValidRoles } from '../auth/interfaces/valid-roles';
import { FilmController } from './film.controller';
import { FilmService } from './film.service';

describe('FilmController', () => {
  const filmService = {
    create: jest.fn(),
    findAll: jest.fn(),
    sincronize: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: FilmController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FilmController(filmService as unknown as FilmService);
  });

  describe('delegacion en el servicio', () => {
    it('create envia los datos al servicio', async () => {
      const dto = { title: 'A New Hope' } as never;
      filmService.create.mockResolvedValue({ id: '1' });

      await expect(controller.create(dto)).resolves.toEqual({ id: '1' });
      expect(filmService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll devuelve el listado del servicio', async () => {
      filmService.findAll.mockResolvedValue([{ id: '1' }]);

      await expect(controller.findAll()).resolves.toEqual([{ id: '1' }]);
    });

    it('sincronize devuelve la cantidad sincronizada', async () => {
      filmService.sincronize.mockResolvedValue({ synced: 6 });

      await expect(controller.sincronize()).resolves.toEqual({ synced: 6 });
    });

    it('findOne busca por id', async () => {
      filmService.findOne.mockResolvedValue({ id: '1' });

      await expect(controller.findOne('1')).resolves.toEqual({ id: '1' });
      expect(filmService.findOne).toHaveBeenCalledWith('1');
    });

    it('update envia el id y los cambios', async () => {
      filmService.update.mockResolvedValue({ id: '1', title: 'x' });

      await controller.update('1', { title: 'x' });

      expect(filmService.update).toHaveBeenCalledWith('1', { title: 'x' });
    });

    it('remove elimina por id', async () => {
      filmService.remove.mockResolvedValue({ affected: 1 });

      await controller.remove('1');

      expect(filmService.remove).toHaveBeenCalledWith('1');
    });
  });

  // Reglas del enunciado: quien puede usar cada endpoint
  describe('proteccion por rol de cada endpoint', () => {
    const reflector = new Reflector();
    const rolesOf = (method: keyof FilmController): string[] =>
      reflector.get(META_ROLES, FilmController.prototype[method]);

    it.each([
      ['findAll', []],
      ['findOne', [ValidRoles.user]],
      ['create', [ValidRoles.admin]],
      ['update', [ValidRoles.admin]],
      ['remove', [ValidRoles.admin]],
      ['sincronize', [ValidRoles.admin]],
    ] as [keyof FilmController, string[]][])(
      '%s exige los roles %j',
      (method, expectedRoles) => {
        expect(rolesOf(method)).toEqual(expectedRoles);
      },
    );

    it.each([
      'create',
      'findAll',
      'sincronize',
      'findOne',
      'update',
      'remove',
    ] as (keyof FilmController)[])(
      '%s aplica el guard de autenticacion y el de roles',
      (method) => {
        const guards = Reflect.getMetadata(
          GUARDS_METADATA,
          FilmController.prototype[method],
        );

        expect(guards).toHaveLength(2);
        expect(guards[1]).toBe(UserRoleGuard);
      },
    );
  });
});
