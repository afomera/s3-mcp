import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/s3.js";

describe("loadConfig", () => {
  const VALID_ENV = {
    S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
    S3_ACCESS_KEY_ID: "key123",
    S3_SECRET_ACCESS_KEY: "secret456",
    S3_BUCKET: "my-bucket",
    S3_PUBLIC_URL: "https://assets.example.com",
  };

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads valid config from env vars", () => {
    Object.assign(process.env, VALID_ENV);

    const config = loadConfig();
    expect(config.endpoint).toBe(VALID_ENV.S3_ENDPOINT);
    expect(config.accessKeyId).toBe(VALID_ENV.S3_ACCESS_KEY_ID);
    expect(config.secretAccessKey).toBe(VALID_ENV.S3_SECRET_ACCESS_KEY);
    expect(config.bucket).toBe(VALID_ENV.S3_BUCKET);
    expect(config.publicUrl).toBe(VALID_ENV.S3_PUBLIC_URL);
  });

  it("defaults region to 'auto'", () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env.S3_REGION;

    const config = loadConfig();
    expect(config.region).toBe("auto");
  });

  it("uses S3_REGION when provided", () => {
    Object.assign(process.env, VALID_ENV, { S3_REGION: "us-east-1" });

    const config = loadConfig();
    expect(config.region).toBe("us-east-1");
  });

  it("defaults pathPrefix to empty string", () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env.S3_PATH_PREFIX;

    const config = loadConfig();
    expect(config.pathPrefix).toBe("");
  });

  it("uses S3_PATH_PREFIX when provided", () => {
    Object.assign(process.env, VALID_ENV, { S3_PATH_PREFIX: "uploads/" });

    const config = loadConfig();
    expect(config.pathPrefix).toBe("uploads/");
  });

  it("strips trailing slash from publicUrl", () => {
    Object.assign(process.env, VALID_ENV, {
      S3_PUBLIC_URL: "https://assets.example.com///",
    });

    const config = loadConfig();
    expect(config.publicUrl).toBe("https://assets.example.com");
  });

  it("throws when S3_ENDPOINT is missing", () => {
    const env = { ...VALID_ENV };
    delete (env as Record<string, string | undefined>).S3_ENDPOINT;
    Object.assign(process.env, env);
    delete process.env.S3_ENDPOINT;

    expect(() => loadConfig()).toThrow("S3_ENDPOINT");
  });

  it("throws when multiple env vars are missing", () => {
    // Clear all S3 vars
    for (const key of Object.keys(VALID_ENV)) {
      delete process.env[key];
    }

    expect(() => loadConfig()).toThrow("S3_ENDPOINT");
    expect(() => loadConfig()).toThrow("S3_ACCESS_KEY_ID");
  });

  it("includes setup instructions in error message", () => {
    for (const key of Object.keys(VALID_ENV)) {
      delete process.env[key];
    }

    expect(() => loadConfig()).toThrow("claude mcp add -e S3_ENDPOINT=... s3-mcp -- npx -y @afomera/s3-mcp");
  });
});
