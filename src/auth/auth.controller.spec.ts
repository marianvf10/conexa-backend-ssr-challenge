import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = { create: jest.fn(), login: jest.fn() };

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('sign-up delega el registro en el servicio', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'Test1234',
      fullname: 'Test User',
    };
    authService.create.mockResolvedValue({ token: 't', email: dto.email });

    await expect(controller.createUser(dto)).resolves.toEqual({
      token: 't',
      email: dto.email,
    });
    expect(authService.create).toHaveBeenCalledWith(dto);
  });

  it('sign-in delega el login en el servicio', async () => {
    const dto = { email: 'user@example.com', password: 'Test1234' };
    authService.login.mockResolvedValue({ token: 't', email: dto.email });

    await expect(controller.loginUser(dto)).resolves.toEqual({
      token: 't',
      email: dto.email,
    });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it.each(['createUser', 'loginUser'] as const)(
    '%s es publico: no aplica ningun guard',
    (method) => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AuthController.prototype[method],
      );

      expect(guards).toBeUndefined();
    },
  );
});
