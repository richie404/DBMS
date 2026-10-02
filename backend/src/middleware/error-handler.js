export default function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
    ? error.status
    : 500;
  const message = error.type === "entity.parse.failed"
    ? "Invalid JSON body"
    : status === 413
      ? "Request body too large"
      : status >= 500
        ? "Internal server error"
        : error.expose ? error.message : "Invalid request";

  if (status >= 500) console.error(error);
  response.status(status).json({ success: false, message });
}
