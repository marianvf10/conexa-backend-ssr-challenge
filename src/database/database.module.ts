import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get<string>('environment') === 'dev';
        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: Number(configService.get('database.port')),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.db'),
          autoLoadEntities:true,
          synchronize: isDev, // solo true en desarrollo
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

