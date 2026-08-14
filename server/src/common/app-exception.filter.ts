import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from './domain-error';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Request');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const route = `${request.method} ${request.originalUrl ?? request.url}`;

    if (exception instanceof DomainError) {
      if (exception.status >= 500) {
        this.logger.error(`${route} → ${exception.status} ${exception.code}: ${exception.message}`);
      }
      response.status(exception.status).json({
        code: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      });
      return;
    }

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const detail = exception instanceof Error ? exception.stack : String(exception);
    this.logger.error(`${route} → 500 INTERNAL_ERROR: ${detail}`);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
  }
}
