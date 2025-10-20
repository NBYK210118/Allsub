import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS 활성화
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // 모든 네트워크 인터페이스에서 수신
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('🚀 AllSub Backend Server Started!');
  console.log('═'.repeat(60));
  console.log(`📍 HTTP Server: http://localhost:${port}`);
  console.log(`🔌 WebSocket: ws://localhost:${port}`);
  console.log(`🌐 CORS: Enabled (all origins)`);
  console.log(`⏰ Started at: ${new Date().toLocaleString('ko-KR')}`);
  console.log('═'.repeat(60));
  console.log('');
  console.log('✅ 서버가 WebSocket 연결을 대기 중입니다...');
  console.log('');
}
bootstrap();
