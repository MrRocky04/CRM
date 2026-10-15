import { ZodError } from 'zod';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: err.errors.map(e => `${e.path.join('.') || 'root'}: ${e.message}`).join(', '),
          details: err.errors
        });
      }
      next(err);
    }
  };
}
