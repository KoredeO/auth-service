import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too Many Requests');
  }
}
