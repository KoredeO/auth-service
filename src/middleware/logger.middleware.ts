import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const statusColor = this.getStatusColor(statusCode);
      
      this.logger.log(
        `${req.method} ${req.originalUrl} - ${statusColor}${statusCode}\x1b[0m - ${duration}ms`
      );
    });

    next();
  }

  private getStatusColor(status: number): string {
    if (status >= 500) return '\x1b[31m'; // Red for server errors
    if (status >= 400) return '\x1b[33m'; // Yellow for client errors
    if (status >= 300) return '\x1b[36m'; // Cyan for redirects
    if (status >= 200) return '\x1b[32m'; // Green for success
    return '\x1b[0m';                      // White for unknown
  }
}
