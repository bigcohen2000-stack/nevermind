/**
 * שכבת כניסה מקומית לאזור הניהול.
 * בפריסה חיה ההגנה העיקרית צריכה להיות דרך Cloudflare Access.
 */

export type AdminRole = "viewer" | "editor" | "admin";

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
  loginTime: number;
}

const DEMO_USERS: Record<string, { password: string; role: AdminRole }> = {
  viewer: { password: "view123", role: "viewer" },
  editor: { password: "edit456", role: "editor" },
  admin: { password: "admin789", role: "admin" },
};

const STORAGE_KEY = "nm-admin-session";
const SESSION_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours

export class AdminAuth {
  /**
   * התחברות עם שם משתמש וסיסמה מקומיים
   */
  static async login(username: string, password: string): Promise<AdminUser | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user = DEMO_USERS[username];
    if (!user || user.password !== password) {
      return null;
    }

    const adminUser: AdminUser = {
      id: `user-${username}-${Date.now()}`,
      username,
      role: user.role,
      loginTime: Date.now(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
    }

    return adminUser;
  }

  /**
   * החזרת המשתמש הנוכחי מה-session
   */
  static getCurrentUser(): AdminUser | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const user: AdminUser = JSON.parse(stored);

      if (Date.now() - user.loginTime > SESSION_TIMEOUT) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  /**
   * התנתק
   */
  static logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * בדיקת הרשאה לפי תפקיד
   */
  static hasPermission(role: AdminRole, requiredRole: AdminRole | string): boolean {
    const roleHierarchy: Record<AdminRole, number> = {
      viewer: 1,
      editor: 2,
      admin: 3,
    };

    const requiredRoleSafe: AdminRole = ["viewer", "editor", "admin"].includes(requiredRole) ? (requiredRole as AdminRole) : "viewer";
    return roleHierarchy[role] >= roleHierarchy[requiredRoleSafe];
  }

  /**
   * רשימת מסכים זמינים לפי תפקיד
   */
  static getAvailablePages(role: AdminRole): string[] {
    switch (role) {
      case "admin":
        return ["dashboard", "generator", "paradoxes", "articles", "services", "settings", "users"];
      case "editor":
        return ["dashboard", "generator", "paradoxes", "articles"];
      case "viewer":
        return ["dashboard"];
      default:
        return [];
    }
  }
}

export const PAGE_PERMISSIONS: Record<
  string,
  {
    label: string;
    minRole: AdminRole;
    icon: string;
    description: string;
  }
> = {
  dashboard: {
    label: "לוח בקרה",
    minRole: "viewer",
    icon: "לוח",
    description: "סטטיסטיקות וסקירה כללית",
  },
  generator: {
    label: "מחולל תוכן",
    minRole: "editor",
    icon: "תוכן",
    description: "יצירת טיוטות ומבנה מאמרים",
  },
  paradoxes: {
    label: "מחולל פרדוקסים",
    minRole: "editor",
    icon: "עומק",
    description: "עבודה על שאלות עומק וניסויי מחשבה",
  },
  articles: {
    label: "מאמרים",
    minRole: "editor",
    icon: "מאמר",
    description: "ניהול ויצירה של מאמרים",
  },
  services: {
    label: "שירותים",
    minRole: "editor",
    icon: "שירות",
    description: "ניהול שירותים וחבילות",
  },
  settings: {
    label: "הגדרות",
    minRole: "admin",
    icon: "הגדר",
    description: "הגדרות כלל-אתר",
  },
  users: {
    label: "משתמשים",
    minRole: "admin",
    icon: "משתמש",
    description: "ניהול משתמשים והרשאות",
  },
};
