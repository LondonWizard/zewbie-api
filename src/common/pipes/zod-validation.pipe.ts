import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

/** Validates incoming data against a Zod schema, throwing 400 on failure. */
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formatted = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formatted,
      });
    }
    return result.data;
  }
}
