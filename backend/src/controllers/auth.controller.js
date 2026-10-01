import { AccountUnavailableError, IncorrectCurrentPasswordError, InvalidCredentialsError, InvalidResetTokenError, RegistrationConflictError, SamePasswordError, changePassword, loginUser, registerUser, requestPasswordReset, resetPasswordWithToken } from "../services/auth.service.js";
import { clearSessionCookieOptions, sessionConfig, sessionCookieOptions } from "../config/session.js";
import { revokeSession } from "../models/session.model.js";
import { validateForgotPasswordInput, validateLoginInput, validatePasswordChangeInput, validateRegistrationInput, validateResetPasswordInput } from "../validators/auth.validator.js";
import { generateCsrfToken } from "../utils/csrf.js";

export async function register(request, response, next) {
  const validation = validateRegistrationInput(request.body);
  if (!validation.valid) {
    return response.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
  }

  try {
    const user = await registerUser(validation.value);
    return response.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { user },
    });
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      const message = error.field === "email"
        ? "An account with this email already exists"
        : error.field === "username"
          ? "This username is already taken"
          : "An account with these details already exists";
      return response.status(409).json({ success: false, message: "Registration conflict", errors: { [error.field]: message } });
    }
    return next(error);
  }
}

function deviceDescription(request) {
  const userAgent = request.get("user-agent");
  return userAgent ? userAgent.slice(0, 255) : null;
}

export async function login(request, response, next) {
  const validation = validateLoginInput(request.body);
  if (!validation.valid) {
    return response.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
  }

  try {
    const result = await loginUser({ ...validation.value, deviceDescription: deviceDescription(request) });
    response.cookie(sessionConfig.cookieName, result.rawToken, sessionCookieOptions);
    return response.json({ success: true, message: "Login successful", data: { user: result.user } });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return response.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (error instanceof AccountUnavailableError) {
      return response.status(403).json({ success: false, message: "Account access is unavailable" });
    }
    return next(error);
  }
}

export function currentUser(request, response) {
  response.json({ success: true, data: { user: request.user } });
}

export function csrfToken(request, response) {
  response.json({ success: true, data: { csrfToken: generateCsrfToken(request.auth.sessionId) } });
}

export async function logout(request, response, next) {
  try {
    await revokeSession(request.auth.sessionId);
    response.clearCookie(sessionConfig.cookieName, clearSessionCookieOptions);
    return response.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function changeCurrentPassword(request, response, next) {
  const validation = validatePasswordChangeInput(request.body);
  if (!validation.valid) {
    return response.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
  }

  try {
    await changePassword({
      userId: request.user.id,
      currentSessionId: request.auth.sessionId,
      ...validation.value,
    });
    return response.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof IncorrectCurrentPasswordError) {
      return response.status(401).json({ success: false, message: "Current password is incorrect" });
    }
    if (error instanceof SamePasswordError) {
      return response.status(400).json({ success: false, message: "Validation failed", errors: { newPassword: "New password must be different" } });
    }
    return next(error);
  }
}

export async function forgotPassword(request, response, next) {
  const validation = validateForgotPasswordInput(request.body);
  if (!validation.valid) {
    return response.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
  }

  try {
    await requestPasswordReset(validation.value.email);
    return response.json({
      success: true,
      message: "If an account exists for that email, password reset instructions have been generated.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(request, response, next) {
  const validation = validateResetPasswordInput(request.body);
  if (!validation.valid) {
    return response.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
  }
  try {
    await resetPasswordWithToken(validation.value);
    return response.json({ success: true, message: "Password reset successfully. Please log in again." });
  } catch (error) {
    if (error instanceof InvalidResetTokenError) {
      return response.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
    if (error instanceof SamePasswordError) {
      return response.status(400).json({ success: false, message: "Validation failed", errors: { newPassword: "New password must be different" } });
    }
    return next(error);
  }
}
