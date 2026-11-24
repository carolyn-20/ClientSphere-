import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export type AuthUser = { id: string; email: string; role: string };
declare global { namespace Express { interface Request { user?: AuthUser } } }
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-only-secret") as AuthUser;
    next();
  } catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}
export function allowRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) =>
    req.user && roles.includes(req.user.role) ? next() : res.status(403).json({ error: "Insufficient permissions" });
}
