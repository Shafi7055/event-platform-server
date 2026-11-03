function createErrorHandler(logger = console) {
  return function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);

    const status = Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599
      ? error.status
      : 500;
    if (status >= 500) logger.error(error);

    return res.status(status).json({
      message: status >= 500 ? 'Internal server error' : error.message,
    });
  };
}

module.exports = { createErrorHandler };
