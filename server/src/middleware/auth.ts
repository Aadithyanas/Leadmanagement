import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userEmail?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const email = req.headers['x-user-email'] as string;
  
  if (!email) {
    return res.status(401).json({ error: 'User identification required' });
  }

  req.userEmail = email;
  next();
};
