/**
 * Per-test-file setup: points the app at the test database and configures
 * test-friendly env BEFORE any app module is imported.
 * (dotenv will not override these because it never overwrites existing vars.)
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret-that-is-long-enough-123456";
process.env.JWT_EXPIRES_IN = "1h";
process.env.COOKIE_SECURE = "false";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.SMTP_HOST = "";
process.env.UPLOAD_DIR = "uploads-test";
// Pin values that the dev .env file would otherwise re-introduce via dotenv
// (dotenv never overwrites vars that are already set).
process.env.DISABLE_RATE_LIMIT = "false";
// Ensure the CSRF/rate-limit test opt-in flags start disabled; individual
// suites opt in via ENABLE_RATE_LIMIT_TESTS / ENABLE_SECURITY_TESTS.
delete process.env.ENABLE_RATE_LIMIT_TESTS;
delete process.env.ENABLE_SECURITY_TESTS;
