import { JWTPayload } from '../config/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      requestId?: string;
      startTime?: number;
    }
  }
}

export {}; 