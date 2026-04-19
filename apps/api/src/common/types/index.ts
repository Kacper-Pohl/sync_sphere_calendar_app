import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
