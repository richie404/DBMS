import { apiRequest, clearCsrfToken, getCsrfToken as getCachedCsrfToken } from "../lib/api";
import type { AuthUser, ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "../types/auth";

type UserResponse = { user: AuthUser };

export const authService = {
  async updateProfile(input: Pick<AuthUser, "name" | "username" | "email" | "phone"> & {avatarUrl?:string}) {
    return (await apiRequest<UserResponse>("/auth/profile", { method: "PATCH", body: input, csrf: true })).user;
  },
  async register(input: RegisterInput) {
    return (await apiRequest<UserResponse>("/auth/register", { method: "POST", body: input })).user;
  },
  async login(input: LoginInput) {
    clearCsrfToken();
    return (await apiRequest<UserResponse>("/auth/login", { method: "POST", body: input })).user;
  },
  async logout() {
    await apiRequest("/auth/logout", { method: "POST", csrf: true });
    clearCsrfToken();
  },
  async getCurrentUser() {
    return (await apiRequest<UserResponse>("/auth/me")).user;
  },
  async changePassword(input: ChangePasswordInput) {
    await apiRequest("/auth/password", { method: "PATCH", body: input, csrf: true });
  },
  async forgotPassword(input: ForgotPasswordInput) {
    await apiRequest("/auth/forgot-password", { method: "POST", body: input });
  },
  async resetPassword(input: ResetPasswordInput) {
    await apiRequest("/auth/reset-password", { method: "POST", body: input });
  },
  getCsrfToken: getCachedCsrfToken,
};
