# @afomera/s3-mcp

A lightweight [MCP](https://modelcontextprotocol.io) server that lets AI coding agents upload files to any S3-compatible bucket and get back public URLs. Works with **Cloudflare R2**, **AWS S3**, **MinIO**, **DigitalOcean Spaces**, **Backblaze B2**, **Wasabi**, and any other S3-compatible provider.

Primary use case: uploading screenshots, images, and other assets during PR reviews, then pasting the URLs into GitHub comments and issues.

## Quick Start

### Cloudflare R2

```bash
claude mcp add s3-mcp \
  -s user \
  -e S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com \
  -e S3_ACCESS_KEY_ID=your_key \
  -e S3_SECRET_ACCESS_KEY=your_secret \
  -e S3_BUCKET=my-assets \
  -e S3_PUBLIC_URL=https://assets.example.com \
  -- npx -y @afomera/s3-mcp
```

### AWS S3

```bash
claude mcp add s3-mcp \
  -s user \
  -e S3_ENDPOINT=https://s3.us-east-1.amazonaws.com \
  -e S3_REGION=us-east-1 \
  -e S3_ACCESS_KEY_ID=AKIA... \
  -e S3_SECRET_ACCESS_KEY=your_secret \
  -e S3_BUCKET=my-assets \
  -e S3_PUBLIC_URL=https://my-assets.s3.amazonaws.com \
  -- npx -y @afomera/s3-mcp
```

### MinIO (local dev)

```bash
claude mcp add s3-mcp \
  -s user \
  -e S3_ENDPOINT=http://localhost:9000 \
  -e S3_REGION=us-east-1 \
  -e S3_ACCESS_KEY_ID=minioadmin \
  -e S3_SECRET_ACCESS_KEY=minioadmin \
  -e S3_BUCKET=dev-assets \
  -e S3_PUBLIC_URL=http://localhost:9000/dev-assets \
  -- npx -y @afomera/s3-mcp
```

### DigitalOcean Spaces

```bash
claude mcp add s3-mcp \
  -s user \
  -e S3_ENDPOINT=https://nyc3.digitaloceanspaces.com \
  -e S3_REGION=nyc3 \
  -e S3_ACCESS_KEY_ID=your_key \
  -e S3_SECRET_ACCESS_KEY=your_secret \
  -e S3_BUCKET=my-space \
  -e S3_PUBLIC_URL=https://my-space.nyc3.digitaloceanspaces.com \
  -- npx -y @afomera/s3-mcp
```

## Team Sharing (`.mcp.json`)

Add to your project's `.mcp.json` so the whole team gets the MCP server automatically:

```json
{
  "mcpServers": {
    "s3-mcp": {
      "command": "npx",
      "args": ["-y", "@afomera/s3-mcp"],
      "env": {
        "S3_ENDPOINT": "${S3_ENDPOINT}",
        "S3_ACCESS_KEY_ID": "${S3_ACCESS_KEY_ID}",
        "S3_SECRET_ACCESS_KEY": "${S3_SECRET_ACCESS_KEY}",
        "S3_BUCKET": "${S3_BUCKET}",
        "S3_PUBLIC_URL": "${S3_PUBLIC_URL}"
      }
    }
  }
}
```

Each team member sets the actual values in their environment.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `S3_ENDPOINT` | Yes | Full endpoint URL for your S3-compatible provider |
| `S3_ACCESS_KEY_ID` | Yes | Access key |
| `S3_SECRET_ACCESS_KEY` | Yes | Secret key |
| `S3_BUCKET` | Yes | Bucket name |
| `S3_PUBLIC_URL` | Yes | Public base URL for the bucket |
| `S3_REGION` | No | Region (defaults to `auto`) |
| `S3_PATH_PREFIX` | No | Auto-prefix for all keys (e.g. `uploads/`) |

## Tools

### `upload_file`

Upload a local file to the bucket and return its public URL.

```json
{ "file_path": "/path/to/screenshot.png" }
```

Returns: `{ "url": "https://...", "key": "...", "size": 45230, "content_type": "image/png" }`

### `upload_base64`

Upload base64-encoded data directly.

```json
{ "data": "iVBORw0KGgo...", "filename": "screenshot.png" }
```

### `upload_from_url`

Fetch a file from a URL and upload it to the bucket.

```json
{ "url": "https://ci.example.com/artifacts/screenshot.png" }
```

### `list_files`

List files in the bucket, optionally filtered by prefix.

```json
{ "prefix": "20250207", "max_results": 20 }
```

### `delete_file`

Delete a file from the bucket.

```json
{ "key": "20250207-a1b2c3-screenshot.png" }
```

## License

MIT
