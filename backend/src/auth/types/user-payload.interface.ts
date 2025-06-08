// src/auth/types/user-payload.interface.ts

export interface UserPayload {
  sub: number;
  role: number;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}
  

  