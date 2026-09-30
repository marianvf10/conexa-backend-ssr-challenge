import { Module } from '@nestjs/common';
import { FilmService } from './film.service';
import { FilmController } from './film.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film } from './entities/film.entity';
import { HttpClientModule } from '@nestjs/http-client';
import { ConfigService } from '@nestjs/config';
import {AuthModule} from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Film]),
    HttpClientModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseUrl: configService.get<string>('starWarsApiUrl'),
        timeout: '5s',
      }),
      inject: [ConfigService],
    }),
    AuthModule
  ],
  controllers: [FilmController],
  providers: [FilmService],
})
export class FilmModule {}
