export type UserRole = "renter" | "owner" | "admin";
export type UserStatus = "active" | "suspended" | "banned";

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
}

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Extract<UserRole, "renter" | "owner">;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}
