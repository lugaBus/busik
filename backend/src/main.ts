import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  // CORS Configuration
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Build allowed origins list
  const allowedOrigins: string[] = [];
  
  // Add frontend URL from environment or default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }
  
  // Add admin URL from environment or default
  const adminUrl = process.env.ADMIN_URL || 'http://localhost:3002';
  if (adminUrl && !allowedOrigins.includes(adminUrl)) {
    allowedOrigins.push(adminUrl);
  }
  
  // In development, also allow localhost origins
  if (isDevelopment) {
    const localhostOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
    ];
    localhostOrigins.forEach(origin => {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    });
  }
  
  // Remove duplicates and filter out empty values
  const uniqueOrigins = [...new Set(allowedOrigins.filter(Boolean))];
  
  console.log(`🔒 CORS: Allowing origins: ${uniqueOrigins.join(', ')}`);
  console.log(`🔒 CORS: Mode: ${isDevelopment ? 'Development (localhost allowed)' : 'Production (strict)'}`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server, nginx proxy, or curl requests)
      // This is safe because nginx is in front and handles external requests
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (uniqueOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Reject origin not in allowed list
        console.warn(`🚫 CORS: Rejected origin: ${origin}`);
        callback(new Error(`CORS: Origin ${origin} is not allowed`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-submitter-id', 'x-language'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('LugaBus API')
    .setDescription('API documentation for LugaBus project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend server running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
