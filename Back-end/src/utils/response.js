const response = (res, statusCode, message, data) => {
  return res
    .status(statusCode)
    .json({
      code: statusCode,
      status: statusCode < 400 ? "Success" : "failed",
      message,
      data,
    })
    .end();
};

export default response;
