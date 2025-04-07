// src/auth/types/user-payload.interface.ts

export interface UserPayload {
    sub: number;
    email: string;
    type: 'access' | 'refresh';
  }
  