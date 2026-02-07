import { describe, it, expect } from "vitest";
import { generateKey, detectContentType } from "../src/tools.js";

describe("generateKey", () => {
  it("generates a key with date-random-filename format", () => {
    const key = generateKey("screenshot.png", "");
    // Format: YYYYMMDD-<6chars>-screenshot.png
    expect(key).toMatch(/^\d{8}-[a-z0-9]{6}-screenshot\.png$/);
  });

  it("uses current date", () => {
    const key = generateKey("test.jpg", "");
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    expect(key).toContain(today);
  });

  it("prepends path prefix", () => {
    const key = generateKey("file.txt", "uploads/");
    expect(key).toMatch(/^uploads\/\d{8}-[a-z0-9]{6}-file\.txt$/);
  });

  it("sanitizes special characters in filename", () => {
    const key = generateKey("my file (1).png", "");
    expect(key).toMatch(/^\d{8}-[a-z0-9]{6}-my_file__1_\.png$/);
    expect(key).not.toContain(" ");
    expect(key).not.toContain("(");
    expect(key).not.toContain(")");
  });

  it("preserves dots, hyphens, and underscores", () => {
    const key = generateKey("my-file_v2.0.png", "");
    expect(key).toContain("my-file_v2.0.png");
  });

  it("generates unique keys on each call", () => {
    const key1 = generateKey("test.png", "");
    const key2 = generateKey("test.png", "");
    expect(key1).not.toBe(key2);
  });
});

describe("detectContentType", () => {
  it("detects common image types", () => {
    expect(detectContentType("photo.png")).toBe("image/png");
    expect(detectContentType("photo.jpg")).toBe("image/jpeg");
    expect(detectContentType("photo.jpeg")).toBe("image/jpeg");
    expect(detectContentType("photo.gif")).toBe("image/gif");
    expect(detectContentType("photo.webp")).toBe("image/webp");
    expect(detectContentType("icon.svg")).toBe("image/svg+xml");
  });

  it("detects document types", () => {
    expect(detectContentType("doc.pdf")).toBe("application/pdf");
    expect(detectContentType("data.json")).toBe("application/json");
    expect(detectContentType("page.html")).toBe("text/html");
    expect(detectContentType("style.css")).toBe("text/css");
    expect(detectContentType("script.js")).toBe("text/javascript");
  });

  it("detects video/audio types", () => {
    expect(detectContentType("video.mp4")).toBe("video/mp4");
    expect(detectContentType("video.webm")).toBe("video/webm");
  });

  it("returns octet-stream for unknown extensions", () => {
    expect(detectContentType("data.xyz123")).toBe("application/octet-stream");
  });

  it("handles files with no extension", () => {
    expect(detectContentType("Makefile")).toBe("application/octet-stream");
  });
});
