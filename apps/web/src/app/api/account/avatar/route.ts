import { randomUUID } from "node:crypto";
import { Files } from "files-sdk";
import { vercelBlob } from "files-sdk/vercel-blob";
import { getSession } from "@/lib/auth-server";

const MAX_AVATAR_BYTES = 1024 * 1024;

const IMAGE_SIGNATURES = [
  { contentType: "image/jpeg", extension: "jpg", magic: [0xff, 0xd8, 0xff] },
  {
    contentType: "image/png",
    extension: "png",
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { contentType: "image/gif", extension: "gif", magic: [0x47, 0x49, 0x46, 0x38] },
] as const;

const startsWith = (bytes: Uint8Array, magic: readonly number[]) =>
  magic.every((byte, index) => bytes[index] === byte);

// WARNING: derive the type from these magic bytes, never the client's MIME, and never accept SVG (stored XSS on the public blob host).
const sniffImageType = (bytes: Uint8Array) => {
  const match = IMAGE_SIGNATURES.find((signature) => startsWith(bytes, signature.magic));

  if (match) {
    return { contentType: match.contentType, extension: match.extension };
  }

  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }

  return null;
};

const requireBlobToken = () =>
  process.env.BLOB_READ_WRITE_TOKEN !== undefined && process.env.BLOB_READ_WRITE_TOKEN !== ""
    ? null
    : new Response(
        "Avatar uploads need BLOB_READ_WRITE_TOKEN. Create a Blob store in the Vercel " +
          "dashboard (Storage → Create → Blob) and add its token to .env.",
        { status: 501 },
      );

// WARNING: build per request, after requireBlobToken; the adapter checks credentials on construction, so a module-scope instance fails `next build` without a token.
const blobFiles = () => new Files({ adapter: vercelBlob({ addRandomSuffix: false }) });

const avatarPrefix = (userId: string) => `avatars/${userId}/`;

const SWEEP_GRACE_MS = 5 * 60 * 1000;

const isStale = (item: { key: string; lastModified?: number }, keepKey?: string) => {
  if (keepKey === undefined) {
    return true;
  }

  const cutoff = Date.now() - SWEEP_GRACE_MS;

  return item.key !== keepKey && (item.lastModified ?? 0) < cutoff;
};

const removeAvatars = async (files: Files, userId: string, keepKey?: string) => {
  const stale: string[] = [];

  for await (const item of files.listAll({ prefix: avatarPrefix(userId) })) {
    if (isStale(item, keepKey)) {
      stale.push(item.key);
    }
  }

  if (stale.length > 0) {
    await files.delete(stale);
  }
};

export const POST = async (request: Request) => {
  const session = await getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const missingToken = requireBlobToken();

  if (missingToken) {
    return missingToken;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return new Response("Missing file", { status: 400 });
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return new Response("File too large (1MB max)", { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = sniffImageType(bytes);

  if (!imageType) {
    return new Response("Unsupported image type", { status: 415 });
  }

  const userId = session.user.id;
  const key = `${avatarPrefix(userId)}${randomUUID()}.${imageType.extension}`;
  const files = blobFiles();

  let url: string;

  try {
    const uploaded = await files.upload(key, new Blob([bytes]), {
      contentType: imageType.contentType,
    });

    url = await files.url(uploaded.key);
  } catch (error) {
    console.error("Avatar upload failed:", error);

    return new Response("Upload failed", { status: 500 });
  }

  try {
    await removeAvatars(files, userId, key);
  } catch (error) {
    console.error("Avatar cleanup failed, leaving orphaned blobs:", error);
  }

  return Response.json({ url });
};

export const DELETE = async () => {
  const session = await getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const missingToken = requireBlobToken();

  if (missingToken) {
    return missingToken;
  }

  await removeAvatars(blobFiles(), session.user.id);

  return new Response(null, { status: 204 });
};
