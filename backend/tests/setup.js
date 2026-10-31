process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL ??= 'postgres://unused:unused@127.0.0.1:5432/unit_test';
