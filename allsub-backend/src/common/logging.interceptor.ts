import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    // 요청 정보 로깅
    console.log('');
    console.log('--- HTTP 요청 수신 (미들웨어) ---');
    console.log(`요청: ${method} ${url}`);
    console.log(`IP: ${request.ip || request.connection?.remoteAddress}`);
    console.log(`요청 시간: ${new Date().toLocaleString('ko-KR')}`);
    
    if (Object.keys(params).length > 0) {
      console.log('Params:', JSON.stringify(params));
    }
    if (Object.keys(query).length > 0) {
      console.log('Query:', JSON.stringify(query));
    }
    if (body && Object.keys(body).length > 0) {
      console.log('Body:', JSON.stringify(body));
    }
    console.log('------------------------------');
    console.log('');

    this.logger.log(`${method} ${url} - Request received`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          
          console.log('');
          console.log('--- HTTP 응답 전송 (미들웨어) ---');
          console.log(`요청: ${method} ${url}`);
          console.log(`Status: ${response.statusCode}`);
          console.log(`처리 시간: ${delay}ms`);
          console.log('------------------------------');
          console.log('');
          
          this.logger.log(`${method} ${url} - ${response.statusCode} - ${delay}ms`);
        },
        error: (error) => {
          const delay = Date.now() - now;
          
          console.error('');
          console.error('--- HTTP 에러 발생 (미들웨어) ---');
          console.error(`요청: ${method} ${url}`);
          console.error(`Error: ${error?.message || error}`);
          console.error(`처리 시간: ${delay}ms`);
          console.error('------------------------------');
          console.error('');
          
          this.logger.error(`${method} ${url} - Error - ${delay}ms - ${error?.message}`);
        },
      }),
    );
  }
}


