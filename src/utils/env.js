import 'dotenv/config';

const required = ['DATABASE_URL'];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `\nMissing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n`
  );
  process.exit(1);
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: Number(process.env.PORT || 8000),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
