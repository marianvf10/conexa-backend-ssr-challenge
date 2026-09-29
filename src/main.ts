import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Conexa Backend SSR Challenge API')
    .setDescription('Conexa Backend SSR Challenge endpoints')
     .addBearerAuth()
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document,{swaggerOptions: { persistAuthorization: true }});

  await app.listen(process.env.PORT ?? 3000);

}
bootstrap();
