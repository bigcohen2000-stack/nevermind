export interface Env {
  CLUB_MEMBERS: KVNamespace;
  CLUB_ACTIVITY: KVNamespace;
  CLUB_IP_PEPPER: string;
  ADMIN_SERVICE_KEY?: string;
  NM_CLUB_ADMIN_SERVICE_KEY?: string;
  ALLOWED_ORIGINS?: string;
}

export type LoginRequest = {
  phone?: string;
  password?: string;
  path?: string;
  fullName?: string;
};

export type AdminResetPasswordRequest = {
  phone?: string;
  newPassword?: string;
};

export type AdminAddMemberRequest = {
  phone?: string;
  password?: string;
  fullName?: string;
  expiresAt?: string;
};

export type SharedAccessLogRequest = {
  phone?: string;
  fullName?: string;
  path?: string;
  identityKey?: string;
  eventType?: "login" | "heartbeat";
};

export type StoredMember = {
  memberName?: string;
  phone?: string;
  passwordHash?: string;
  expiresAt?: string;
  status?: "active" | "paused" | "blocked";
  passwordGroup?: string;
  lastLoginAt?: string;
  lastIpHash?: string;
  flaggedAt?: string;
};

export type ActivityEntry = {
  ipHash: string;
  seenAt: string;
  path: string;
  phone: string;
  memberName?: string;
  userAgent: string;
  source?: "LIVE" | "SHARED";
  identityKey?: string;
  eventType?: "login" | "heartbeat";
};

export type FraudFlagEntry = {
  phone: string;
  flaggedAt: string;
  memberIpCount?: number;
  passwordIpCount?: number;
  lastPath?: string;
};

export type DeepPageBeacon = {
  path: string;
  seenAt: string;
  ipHash: string;
};

export type IntegrityReportEntry = {
  pageUrl: string;
  pagePath: string;
  pageTitle?: string;
  selectedText?: string;
  note?: string;
  message?: string;
  reportedAt: string;
  reporterFingerprint: string;
  reporterAgent?: string;
};

export type AdminMemberSummary = {
  phone: string;
  memberName: string;
  status: "active" | "paused" | "blocked";
  expiresAt: string;
  lastLoginAt: string;
  lastIpFingerprint: string;
  isActive: boolean;
  flaggedAt?: string;
};

export type AdminMemberTimelineItem = {
  id: string;
  kind: "login" | "flag" | "membership";
  at: string;
  title: string;
  detail: string;
};

export type MemberProgressStored = {
  articlesRead: string[];
  secondsRead: number;
  updatedAt: string;
  lastIpPrefix?: string;
};

export type ProgressTokenPayload = {
  typ: "progress";
  phone: string;
  exp: number;
};
