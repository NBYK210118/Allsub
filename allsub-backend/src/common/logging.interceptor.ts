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
    console.log('[HTTP] Request received (interceptor)');
    console.log(`  URL: ${method} ${url}`);
    console.log(`  IP: ${request.ip || request.connection?.remoteAddress}`);
    console.log(`  Timestamp: ${new Date().toLocaleString('ko-KR')}`);

    if (Object.keys(params).length > 0) {
      console.log('  Params:', JSON.stringify(params));
    }
    if (Object.keys(query).length > 0) {
      console.log('  Query:', JSON.stringify(query));
    }
    if (body && Object.keys(body).length > 0) {
      console.log('  Body:', JSON.stringify(body));
    }
    console.log('----------------------------------------');
    console.log('');

    this.logger.log(`${method} ${url} - Request received`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          
          console.log('');
          console.log('[HTTP] Response sent (interceptor)');
          console.log(`  URL: ${method} ${url}`);
          console.log(`  Status: ${response.statusCode}`);
          console.log(`  Duration: ${delay}ms`);
          console.log('----------------------------------------');
          console.log('');
          
          this.logger.log(`${method} ${url} - ${response.statusCode} - ${delay}ms`);
        },
        error: (error) => {
          const delay = Date.now() - now;
          
          console.error('');
          console.error('[HTTP] Error encountered (interceptor)');
          console.error(`  URL: ${method} ${url}`);
          console.error(`  Error: ${error?.message || error}`);
          console.error(`  Duration: ${delay}ms`);
          console.error('----------------------------------------');
          console.error('');
          
          this.logger.error(`${method} ${url} - Error - ${delay}ms - ${error?.message}`);
        },
      }),
    );
  }
}


