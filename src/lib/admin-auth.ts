/**
 * Admin Authentication & Authorization
 * הערה: בשרת אמיתי, צריך לתקשר עם backend מאובטח
 * כאן - demo עם localStorage (אל מדות לא להשתמש בעיתוד לרגיש truly)
 */

export type AdminRole = "viewer" | "editor" | "admin";

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
  loginTime: number;
}

/**
 * Demo credentials - במערכת אמיתית יהיה backend מאובטח
 * במצב פיתוח זה סתם דוגמה
 */
const DEMO_USERS: Record<string, { password: string; role: AdminRole }> = {
  viewer: { password: "view123", role: "viewer" },
  editor: { password: "edit456", role: "editor" },
  admin: { password: "admin789", role: "admin" },
};

const STORAGE_KEY = "nm-admin-session";
const SESSION_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours

export class AdminAuth {
  /**
   * התחבר עם שם משתמש וסיסמה
   */
  static async login(username: string, password: string): Promise<AdminUser | null> {
    // Simulate network delay
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
   * קבל את המשתמש הנוכחי מ-session
   */
  static getCurrentUser(): AdminUser | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const user: AdminUser = JSON.parse(stored);

      // בדוק אם session הוא עדיין בתוקף
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
   * בדוק אם למשתמש יש הרשאה מסוימת
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
   * קבל עמודים זמינים לפי role
   */
  static getAvailablePages(role: AdminRole): string[] {
    switch (role) {
      case "admin":
        return ["dashboard", "articles", "services", "settings", "users"];
      case "editor":
        return ["dashboard", "articles"];
      case "viewer":
        return ["dashboard"];
      default:
        return [];
    }
  }
}

/**
 * הרשאות לעמוד מסוים
 */
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
    icon: "📊",
    description: "סטטיסטיקות וסקירה כללית",
  },
  articles: {
    label: "מאמרים",
    minRole: "editor",
    icon: "📝",
    description: "ניהול ויצירה של מאמרים",
  },
  services: {
    label: "שירותים",
    minRole: "editor",
    icon: "🛠️",
    description: "ניהול שירותים וחבילות",
  },
  settings: {
    label: "הגדרות",
    minRole: "admin",
    icon: "⚙️",
    description: "הגדרות כלל-אתר",
  },
  users: {
    label: "משתמשים",
    minRole: "admin",
    icon: "👥",
    description: "ניהול משתמשים והרשאות",
  },
};
