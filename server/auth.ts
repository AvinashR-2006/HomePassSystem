import type { Request, Response, NextFunction } from "express";

export interface User {
  email: string;
  role: 'student' | 'parent' | 'warden' | 'security';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Simple authentication middleware based on email domain
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // In a real implementation, this would validate JWT tokens or session cookies
  // For now, we'll use a simple email-based authentication from headers
  const email = req.headers['x-user-email'] as string;
  
  if (!email) {
    return res.status(401).json({ message: "Authentication required. Please provide x-user-email header." });
  }

  // Determine user role based on email pattern - check specific roles first
  let role: User['role'];
  
  if (email.includes('warden') || email.includes('hostel')) {
    role = 'warden';
  } else if (email.includes('security') || email.includes('guard')) {
    role = 'security';
  } else if (email.includes('parent') || email.includes('guardian')) {
    role = 'parent';
  } else if (email.endsWith('@ssn.edu.in')) {
    role = 'student';
  } else {
    return res.status(401).json({ message: "Invalid email domain or pattern" });
  }

  req.user = { email, role };
  next();
}

// Role-based authorization middleware
export function requireRole(allowedRoles: User['role'][]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
}

// Helper function to check if user can access specific data
export function canAccessPass(user: User, pass: any): boolean {
  switch (user.role) {
    case 'student':
      return pass.studentEmail === user.email;
    case 'parent':
      return pass.parentEmail === user.email;
    case 'warden':
    case 'security':
      return true; // Warden and security can access all passes
    default:
      return false;
  }
}