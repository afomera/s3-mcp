import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import mime from "mime";
import { S3Client } from "@aws-sdk/client-s3";
import {
  uploadObject,
  listObjects,
  deleteObject,
  type S3Config,
} from "./s3.js";

export function generateKey(filename: string, prefix: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8);
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}${date}-${rand}-${sanitized}`;
}

export function detectContentType(filename: string): string {
  return mime.getType(filename) ?? "application/octet-stream";
}

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export function registerTools(
  server: McpServer,
  client: S3Client,
  config: S3Config
) {
  const { bucket, publicUrl, pathPrefix } = config;

  server.tool(
    "upload_file",
    "Upload a local file to the S3 bucket and return its public URL",
    {
      file_path: z.string().describe("Absolute path to the local file"),
      key: z
        .string()
        .optional()
        .describe("Custom object key. Auto-generated if omitted"),
    },
    async ({ file_path, key }) => {
      try {
        const body = await readFile(file_path);
        const filename = basename(file_path);
        const contentType = detectContentType(filename);
        const objectKey = key ?? generateKey(filename, pathPrefix);

        await uploadObject(client, bucket, objectKey, body, contentType);

        return jsonResult({
          url: `${publicUrl}/${objectKey}`,
          key: objectKey,
          size: body.length,
          content_type: contentType,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(message);
      }
    }
  );

  server.tool(
    "upload_base64",
    "Upload base64-encoded data to the S3 bucket and return its public URL",
    {
      data: z.string().describe("Base64-encoded file content"),
      filename: z
        .string()
        .describe("Filename for key generation and extension detection"),
      content_type: z
        .string()
        .optional()
        .describe("MIME type. Inferred from filename if omitted"),
      key: z
        .string()
        .optional()
        .describe("Custom object key. Auto-generated if omitted"),
    },
    async ({ data, filename, content_type, key }) => {
      try {
        const body = Buffer.from(data, "base64");
        const contentType = content_type ?? detectContentType(filename);
        const objectKey = key ?? generateKey(filename, pathPrefix);

        await uploadObject(client, bucket, objectKey, body, contentType);

        return jsonResult({
          url: `${publicUrl}/${objectKey}`,
          key: objectKey,
          size: body.length,
          content_type: contentType,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(message);
      }
    }
  );

  server.tool(
    "upload_from_url",
    "Fetch a file from a URL and upload it to the S3 bucket",
    {
      url: z.string().url().describe("URL to fetch the file from"),
      filename: z
        .string()
        .optional()
        .describe(
          "Override filename for key generation. Inferred from URL if omitted"
        ),
      key: z
        .string()
        .optional()
        .describe("Custom object key. Auto-generated if omitted"),
    },
    async ({ url, filename, key }) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return errorResult(
            `Failed to fetch URL: ${response.status} ${response.statusText}`
          );
        }

        const body = Buffer.from(await response.arrayBuffer());
        const inferredFilename =
          filename ?? (basename(new URL(url).pathname) || "download");
        const contentType =
          response.headers.get("content-type") ??
          detectContentType(inferredFilename);
        const objectKey = key ?? generateKey(inferredFilename, pathPrefix);

        await uploadObject(client, bucket, objectKey, body, contentType);

        return jsonResult({
          url: `${publicUrl}/${objectKey}`,
          key: objectKey,
          size: body.length,
          content_type: contentType,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(message);
      }
    }
  );

  server.tool(
    "list_files",
    "List files in the S3 bucket, optionally filtered by prefix",
    {
      prefix: z.string().optional().describe("Filter by key prefix"),
      max_results: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Maximum number of results (default 20, max 100)"),
    },
    async ({ prefix, max_results }) => {
      try {
        const fullPrefix = prefix
          ? `${pathPrefix}${prefix}`
          : pathPrefix || undefined;

        const objects = await listObjects(
          client,
          bucket,
          fullPrefix,
          max_results
        );

        const files = objects.map((obj) => ({
          key: obj.key,
          url: `${publicUrl}/${obj.key}`,
          size: obj.size,
          last_modified: obj.lastModified,
        }));

        return jsonResult({ files, count: files.length });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(message);
      }
    }
  );

  server.tool(
    "delete_file",
    "Delete a file from the S3 bucket",
    {
      key: z.string().describe("Object key to delete"),
    },
    async ({ key }) => {
      try {
        await deleteObject(client, bucket, key);
        return jsonResult({ deleted: true, key });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(message);
      }
    }
  );
}
