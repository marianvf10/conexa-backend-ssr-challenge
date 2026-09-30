import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AdminSeedService } from './admin-seed.service';
import { User } from '../entities/user.entity';
import { ValidRoles } from '../interfaces/valid-roles';

describe('AdminSeedService', () => {
  const adminConfig = {
    'admin.email': 'admin@example.com',
    'admin.password': 'Admin123',
    'admin.fullname': 'Admin',
  };

  let service: AdminSeedService;
  const userRepository = {
    findOneBy: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminSeedService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: ConfigService,
          useValue: { getOrThrow: (key: string) => adminConfig[key] },
        },
      ],
    }).compile();

    service = moduleRef.get(AdminSeedService);
  });

  it('crea el admin con la contraseña hasheada si no existe', async () => {
    userRepository.findOneBy.mockResolvedValue(null);

    await service.onModuleInit();

    expect(userRepository.save).toHaveBeenCalledTimes(1);
    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser.email).toBe('admin@example.com');
    expect(savedUser.fullname).toBe('Admin');
    expect(savedUser.roles).toEqual([ValidRoles.admin]);
    expect(savedUser.password).not.toBe('Admin123');
    expect(await bcrypt.compare('Admin123', savedUser.password)).toBe(true);
  });

  it('no crea nada si el admin ya existe', async () => {
    userRepository.findOneBy.mockResolvedValue({
      email: 'admin@example.com',
      roles: [ValidRoles.admin],
    });

    await service.onModuleInit();

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('no modifica a un usuario existente que no es admin', async () => {
    userRepository.findOneBy.mockResolvedValue({
      email: 'admin@example.com',
      roles: [ValidRoles.user],
    });

    await service.onModuleInit();

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
