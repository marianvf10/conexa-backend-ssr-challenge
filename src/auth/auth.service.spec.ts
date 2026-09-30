import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

describe('AuthService', () => {
  const userRepository = {
    create: jest.fn((data) => ({ ...data })),
    // TypeORM completa el id al guardar: se simula mutando la entidad
    save: jest.fn(async (user) => {
      user.id = 'user-id';
      return user;
    }),
    findOne: jest.fn(),
  };
  const jwtService = { sign: jest.fn(() => 'signed-token') };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      email: 'user@example.com',
      password: 'Test1234',
      fullname: 'Test User',
    };

    it('guarda la contraseña hasheada, nunca en texto plano', async () => {
      await service.create(dto);

      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.password).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, savedUser.password)).toBe(true);
    });

    it('devuelve el token y el email, sin exponer la contraseña', async () => {
      const result = await service.create(dto);

      expect(result).toEqual({ token: 'signed-token', email: dto.email });
    });

    it('firma el token solo con el id del usuario (sub)', async () => {
      await service.create(dto);

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-id' });
    });

    it('responde 400 si el email ya esta registrado', async () => {
      userRepository.save.mockRejectedValueOnce({ code: '23505' });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('responde 500 ante cualquier otro error de la base', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      userRepository.save.mockRejectedValueOnce(new Error('db caida'));

      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('login', () => {
    const credentials = { email: 'user@example.com', password: 'Test1234' };
    const storedUser = {
      id: 'user-id',
      email: credentials.email,
      password: bcrypt.hashSync(credentials.password, 4),
    };

    it('devuelve el token y el email con credenciales validas', async () => {
      userRepository.findOne.mockResolvedValue(storedUser);

      const result = await service.login(credentials);

      expect(result).toEqual({ token: 'signed-token', email: credentials.email });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-id' });
    });

    it('pide explicitamente id, email y password (password tiene select: false)', async () => {
      userRepository.findOne.mockResolvedValue(storedUser);

      await service.login(credentials);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: credentials.email },
        select: { email: true, password: true, id: true },
      });
    });

    it('responde 401 si el usuario no existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(credentials)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('responde 401 si la contraseña es incorrecta', async () => {
      userRepository.findOne.mockResolvedValue(storedUser);

      await expect(
        service.login({ ...credentials, password: 'Otra1234' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('usa el mismo mensaje para email inexistente y contraseña incorrecta', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      const emailError = await service.login(credentials).catch((e) => e);

      userRepository.findOne.mockResolvedValueOnce(storedUser);
      const passwordError = await service
        .login({ ...credentials, password: 'Otra1234' })
        .catch((e) => e);

      expect(emailError.message).toBe(passwordError.message);
    });
  });
});
