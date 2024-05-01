const asyncHandler = (requestHandler) => {
  return (res, req, next) => {
    Promise.resolve(requestHandler(res, req, next)).catch((error) => {
      next(error);
    });
  };
};

// const asyncHandler = (fn) = async (res, req, next) => {
//   try {
//     await fn(res, req, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

export { asyncHandler };
