// src/types/express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    auth?: {
      token: string;
      loginTime: Date;
    };
    movieCount?: Record<string, number>;
  }


}

import { Request } from 'express';

declare module 'express' {
  interface Request {
    session: Session & Partial<SessionData>;
  }
}

