/**
 * Admin Authentication & Authorization
 * Manages user sessions, roles, and permissions for the admin panel
 */

export type AdminRole = "viewer" | "editor" | "admin";

export interface AdminUser {
  id: string;
  code: string;
  phone: string;
  role: AdminRole;
  lastLogin?: number;
}

const STORAGE_KEY = "nm-admin-session";
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AdminAuth {
  private static currentUser: AdminUser | null = null;
  private static initialized = false;

  static initialize(): void {
    if (typeof window === "undefined" || AdminAuth.initialized) return;
    AdminAuth.initialized = true;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        AdminAuth.currentUser = null;
        return;
      }

      const session: AdminUser & { createdAt?: number } = JSON.parse(stored);
      const now = Date.now();

      // Check if session has expired
      if (session.createdAt && now - session.createdAt > SESSION_TIMEOUT) {
        AdminAuth.logout();
        return;
      }

      AdminAuth.currentUser = {
        id: session.id,
        code: session.code,
        phone: session.phone,
        role: session.role,
        lastLogin: session.lastLogin,
      };
    } catch {
      AdminAuth.currentUser = null;
    }
  }

  static getCurrentUser(): AdminUser | null {
    AdminAuth.initialize();
    return AdminAuth.currentUser;
  }

  static login(user: AdminUser): void {
    if (typeof window === "undefined") return;

    AdminAuth.currentUser = user;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...user,
          createdAt: Date.now(),
        })
      );
    } catch {
      // Private browsing or quota exceeded
    }
  }

  static logout(): void {
    AdminAuth.currentUser = null;
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }

  static hasPermission(userRole: AdminRole, requiredRole: AdminRole): boolean {
    const roleHierarchy: Record<AdminRole, number> = {
      viewer: 1,
      editor: 2,
      admin: 3,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  static isAuthenticated(): boolean {
    return AdminAuth.getCurrentUser() !== null;
  }
}
