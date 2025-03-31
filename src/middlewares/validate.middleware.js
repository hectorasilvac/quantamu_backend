export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.details.map((e) => e.message) });
    }
    next();
  };
};
