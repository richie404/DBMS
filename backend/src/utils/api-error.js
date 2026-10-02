export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

export function assert(condition, status, message) {
  if (!condition) throw new ApiError(status, message);
}
