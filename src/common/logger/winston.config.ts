import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, context, stack }) => {
    const ctx = context ? `[${context as string}]` : '';
    const stackLine = stack ? `\n${stack as string}` : '';
    return `${ts as string} ${level} ${ctx} ${message as string}${stackLine}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json(),
);

/** Returns Winston transport configuration based on NODE_ENV. */
export function winstonConfig(): WinstonModuleOptions {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    transports: [
      new winston.transports.Console({
        format: isProd ? prodFormat : devFormat,
        level: isProd ? 'info' : 'debug',
      }),
    ],
  };
}
