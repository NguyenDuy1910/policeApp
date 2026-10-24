import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      response.status(exception.getStatus()).json(typeof payload === 'string' ? { message: payload } : payload);
      return;
    }
    if (exception instanceof MulterError) {
      const status = exception.code === 'LIMIT_FILE_SIZE' ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;
      response.status(status).json({
        error: exception.code,
        message: exception.code === 'LIMIT_FILE_SIZE' ? 'Ảnh đính kèm vượt quá giới hạn 5 MB.' : 'Tệp đính kèm không hợp lệ.',
      });
      return;
    }
    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'INTERNAL_ERROR',
      message: 'Máy chủ gặp lỗi. Vui lòng thử lại.',
    });
  }
}
