import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ConfigModule.forRoot(),
  TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port:+(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    autoLoadEntities: true, //para que TypeORM cargue automáticamente las entidades que nosotros vamos creando
    synchronize: true, //FALSE EN PRODUCCIÓN, SOLO PARA DESARROLLO

  }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
