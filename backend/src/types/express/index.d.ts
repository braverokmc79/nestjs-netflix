// src/types/express/index.d.ts
import { UserPayload } from 'src/auth/types/user-payload.interface';


declare namespace Express {
    export interface Request {
      user?: UserPayload; 
    }
  }
  