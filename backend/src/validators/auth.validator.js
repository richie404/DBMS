const publicRoles = new Set(["renter", "owner"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[A-Za-z0-9_]{3,50}$/;
const maximumPasswordLength = 256;

function requiredString(value, field, errors) {
  if (typeof value !== "string") {
    errors[field] = "This field is required";
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    errors[field] = "This field is required";
    return null;
  }
  return normalized;
}

export function validateRegistrationInput(body) {
  const errors = {};
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const name = requiredString(input.name, "name", errors);
  const username = requiredString(input.username, "username", errors);
  const rawEmail = requiredString(input.email, "email", errors);
  const password = input.password;
  const confirmPassword = input.confirmPassword;
  const role = input.role;

  if (name && name.length > 150) errors.name = "Name must be at most 150 characters";
  if (rawEmail && rawEmail.length > 254) errors.email = "Email must be at most 254 characters";

  if (username && !usernamePattern.test(username)) {
    errors.username = "Username must use 3-50 letters, numbers, or underscores";
  }
  if (rawEmail && !emailPattern.test(rawEmail)) {
    errors.email = "Enter a valid email address";
  }
  if (typeof password !== "string" || password.length === 0) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (password.length > maximumPasswordLength) {
    errors.password = "Password must be at most 256 characters";
  }
  if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
    errors.confirmPassword = "Please confirm your password";
  } else if (typeof password === "string" && confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match";
  }
  if (typeof role !== "string" || !publicRoles.has(role)) {
    errors.role = "Choose renter or owner";
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    value: {
      name,
      username,
      email: rawEmail.toLowerCase(),
      password,
      role,
    },
  };
}

export function validateLoginInput(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const errors = {};
  const rawEmail = requiredString(input.email, "email", errors);
  const password = input.password;

  if (rawEmail && !emailPattern.test(rawEmail)) errors.email = "Enter a valid email address";
  if (typeof password !== "string" || password.length === 0) errors.password = "Password is required";
  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, value: { email: rawEmail.toLowerCase(), password } };
}

export function validatePasswordChangeInput(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const errors = {};
  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword;
  const confirmNewPassword = input.confirmNewPassword;

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    errors.currentPassword = "Current password is required";
  }
  if (typeof newPassword !== "string" || newPassword.length === 0) {
    errors.newPassword = "New password is required";
  } else if (newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  } else if (newPassword.length > maximumPasswordLength) {
    errors.newPassword = "Password must be at most 256 characters";
  }
  if (typeof confirmNewPassword !== "string" || confirmNewPassword.length === 0) {
    errors.confirmNewPassword = "Please confirm your new password";
  } else if (typeof newPassword === "string" && confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = "Passwords do not match";
  }
  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, value: { currentPassword, newPassword } };
}

export function validateForgotPasswordInput(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const errors = {};
  const rawEmail = requiredString(input.email, "email", errors);
  if (rawEmail && !emailPattern.test(rawEmail)) errors.email = "Enter a valid email address";
  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, value: { email: rawEmail.toLowerCase() } };
}

export function validateResetPasswordInput(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const errors = {};
  const token = input.token;
  const newPassword = input.newPassword;
  const confirmNewPassword = input.confirmNewPassword;

  if (typeof token !== "string" || token.length === 0) errors.token = "Reset token is required";
  if (typeof newPassword !== "string" || newPassword.length === 0) {
    errors.newPassword = "New password is required";
  } else if (newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  } else if (newPassword.length > maximumPasswordLength) {
    errors.newPassword = "Password must be at most 256 characters";
  }
  if (typeof confirmNewPassword !== "string" || confirmNewPassword.length === 0) {
    errors.confirmNewPassword = "Please confirm your new password";
  } else if (typeof newPassword === "string" && confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = "Passwords do not match";
  }
  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, value: { token, newPassword } };
}
