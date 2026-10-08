import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

export const ClientInfo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClientInfo => {
    const request = ctx.switchToHttp().getRequest();
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };
  },
);
