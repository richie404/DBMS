// Email delivery is intentionally not configured yet. This no-op keeps token creation
// separate from a future provider integration and never logs the raw reset token.
export async function deliverPasswordResetInstructions(user, rawToken) {
  void user;
  void rawToken;
}
