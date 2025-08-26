// Simple authentication utilities for testing
export const AUTH_HEADERS = {
  'x-user-email': 'test@ssn.edu.in',
  'Content-Type': 'application/json',
};

export const PARENT_HEADERS = {
  'x-user-email': 'parent@gmail.com',
  'Content-Type': 'application/json',
};

export const WARDEN_HEADERS = {
  'x-user-email': 'warden@ssn.edu.in',
  'Content-Type': 'application/json',
};

export const SECURITY_HEADERS = {
  'x-user-email': 'security@ssn.edu.in',
  'Content-Type': 'application/json',
};

export function setAuthHeaders(headers: Record<string, string>) {
  // This would be replaced with proper JWT token handling in production
  return headers;
}

export function getUserRole(email: string): 'student' | 'parent' | 'warden' | 'security' | null {
  if (email.endsWith('@ssn.edu.in')) {
    if (email.includes('warden') || email.includes('hostel')) return 'warden';
    if (email.includes('security') || email.includes('guard')) return 'security';
    return 'student';
  }
  if (email.includes('parent') || email.includes('guardian')) return 'parent';
  if (email.includes('warden') || email.includes('hostel')) return 'warden';
  if (email.includes('security') || email.includes('guard')) return 'security';
  return null;
}