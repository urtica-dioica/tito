import { JWTPayload } from '../config/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      requestId?: string;
      startTime?: number;
      kioskContext?: {
        authenticated: boolean;
        apiKey?: string;
        type?: string;
      };
    }
  }
}

export {}; 