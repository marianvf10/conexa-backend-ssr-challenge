import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ValidRoles } from '../interfaces/valid-roles';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.getOrThrow<string>('admin.email');
    const password = this.configService.getOrThrow<string>('admin.password');
    const fullname = this.configService.getOrThrow<string>('admin.fullname');

    const existingUser = await this.userRepository.findOneBy({ email });

    if (existingUser) {
      // Nunca se asciende en silencio a un usuario que ya existe con ese email
      if (!existingUser.roles.includes(ValidRoles.admin)) {
        this.logger.warn(
          `El usuario ${email} ya existe sin rol admin: no se modifica`,
        );
      }
      return;
    }

    const admin = this.userRepository.create({
      email,
      fullname,
      password: await bcrypt.hash(password, 10),
      roles: [ValidRoles.admin],
    });
    await this.userRepository.save(admin);

    this.logger.log(`Usuario admin creado: ${email}`);
  }
}
