import type { SupabaseClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth-server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

// Matches the "1MB max" copy in the profile form
const MAX_AVATAR_BYTES = 1024 * 1024;

// Both the stored extension and the Content-Type are derived from the file's
// magic bytes, never the client-supplied MIME type (which an attacker controls).
// SVG is deliberately excluded: it can carry <script>, and these land on a
// public bucket URL — a scripted SVG served as image/svg+xml would be stored XSS.
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

/** Identifies an image from its leading bytes, or null if unrecognized. */
const sniffImageType = (bytes: Uint8Array) => {
  const match = IMAGE_SIGNATURES.find((signature) => startsWith(bytes, signature.magic));
  if (match) {
    return { contentType: match.contentType, extension: match.extension };
  }
  // WebP: "RIFF" <4-byte size> "WEBP"
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
};

// Avatars live at `${userId}/avatar.<ext>`; the extension can change between
// uploads, so clear the folder rather than tracking the previous path
const removeExistingAvatars = async (client: SupabaseClient, userId: string) => {
  const { data: files } = await client.storage.from("avatars").list(userId);
  if (files && files.length > 0) {
    await client.storage.from("avatars").remove(files.map((file) => `${userId}/${file.name}`));
  }
};

export const POST = async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
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

  const client = getSupabaseServerClient();
  const userId = session.user.id;

  await removeExistingAvatars(client, userId);

  const path = `${userId}/avatar.${imageType.extension}`;
  const { error } = await client.storage.from("avatars").upload(path, bytes, {
    cacheControl: "3600",
    contentType: imageType.contentType,
    upsert: true,
  });
  if (error) {
    console.error("Avatar upload failed:", error);
    return new Response("Upload failed", { status: 500 });
  }

  const { data } = client.storage.from("avatars").getPublicUrl(path);
  // The path is stable across uploads, so bust caches with a version param
  return Response.json({ url: `${data.publicUrl}?v=${Date.now()}` });
};

export const DELETE = async () => {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = getSupabaseServerClient();
  await removeExistingAvatars(client, session.user.id);

  return new Response(null, { status: 204 });
};
