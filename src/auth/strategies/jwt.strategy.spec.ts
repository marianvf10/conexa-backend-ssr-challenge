import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const userRepository = { findOneBy: jest.fn() };
  const configWith = (secret?: string) =>
    ({ get: jest.fn(() => secret) }) as unknown as ConfigService;

  const buildStrategy = () =>
    new JwtStrategy(
      userRepository as unknown as Repository<User>,
      configWith('test-secret'),
    );

  beforeEach(() => jest.clearAllMocks());

  it('no se construye si falta el secreto del JWT', () => {
    expect(
      () =>
        new JwtStrategy(
          userRepository as unknown as Repository<User>,
          configWith(undefined),
        ),
    ).toThrow('JWT_SECRET');
  });

  describe('validate', () => {
    it('devuelve el usuario completo buscado por el id del payload', async () => {
      const user = { id: 'user-id', email: 'user@example.com', roles: ['user'] };
      userRepository.findOneBy.mockResolvedValue(user);

      const result = await buildStrategy().validate({ sub: 'user-id' });

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-id' });
      expect(result).toBe(user);
    });

    it('responde 401 si el usuario ya no existe', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(
        buildStrategy().validate({ sub: 'user-id' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('responde 401 sin consultar la base si el payload no trae sub', async () => {
      // TypeORM ignora las condiciones undefined y devolveria al primer usuario
      await expect(
        buildStrategy().validate({} as { sub: string }),
      ).rejects.toThrow(UnauthorizedException);

      expect(userRepository.findOneBy).not.toHaveBeenCalled();
    });
  });
});
