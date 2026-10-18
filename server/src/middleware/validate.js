export function validate(schemaOrOptions) {
  const options =
    schemaOrOptions && (schemaOrOptions.parseAsync || schemaOrOptions.safeParseAsync)
      ? { body: schemaOrOptions }
      : schemaOrOptions || {};
  const { body, query, params } = options;

  return async (req, res, next) => {
    try {
      if (body) {
        req.body = await body.parseAsync(req.body);
      }
      if (query) {
        req.query = await query.parseAsync(req.query);
      }
      if (params) {
        req.params = await params.parseAsync(req.params);
      }
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const fields = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.');
          if (!fields[path]) {
            fields[path] = issue.message;
          }
        }
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please check the marked fields.',
            fields
          }
        });
      }
      next(err);
    }
  };
}
