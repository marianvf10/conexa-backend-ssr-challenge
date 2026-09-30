import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EnvConfiguration } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { JoiValidationSchema } from './config/joi.validation';
import { FilmModule } from './film/film.module';

@Module({
  imports: [ConfigModule.forRoot({
    load: [EnvConfiguration],
    isGlobal: true,
    validationSchema: JoiValidationSchema // opcional, hace ConfigService accesible en todos los módulos
  }),
  DatabaseModule,
  AuthModule,
  FilmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
