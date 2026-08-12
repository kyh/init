import { del, list, put } from "@vercel/blob";
import { getSession } from "@/lib/auth-server";

// Matches the "1MB max" copy in the profile form
const MAX_AVATAR_BYTES = 1024 * 1024;

// Both the stored extension and the Content-Type are derived from the file's
// magic bytes, never the client-supplied MIME type (which an attacker controls).
// SVG is deliberately excluded: it can carry <script>, and these land on a
// public blob URL — a scripted SVG served as image/svg+xml would be stored XSS.
const IMAGE_SIGNATURES = [
  { extension: "jpg", contentType: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  {
    extension: "png",
    contentType: "image/png",
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { extension: "gif", contentType: "image/gif", magic: [0x47, 0x49, 0x46, 0x38] },
] as const;

const startsWith = (bytes: Uint8Array, magic: readonly number[]) =>
  magic.every((byte, index) => bytes[index] === byte);

/** Identifies an image from its leading bytes, or null if unrecognized. */
const sniffImageType = (bytes: Uint8Array) => {
  const match = IMAGE_SIGNATURES.find((signature) => startsWith(bytes, signature.magic));
  if (match) {
    return { extension: match.extension, contentType: match.contentType };
  }
  // WebP: "RIFF" <4-byte size> "WEBP"
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
};

// Vercel Blob has no local emulator, so a dev clone without a Blob store gets a
// pointer instead of the SDK's opaque "No token found" throw.
const requireBlobToken = () =>
  process.env.BLOB_READ_WRITE_TOKEN
    ? null
    : new Response(
        "Avatar uploads need BLOB_READ_WRITE_TOKEN. Create a Blob store in the Vercel " +
          "dashboard (Storage → Create → Blob) and add its token to .env.",
        { status: 501 },
      );

// Avatars live under `avatars/<userId>/`. Each upload gets a randomized
// pathname so its CDN URL is unique — the alternative, reusing one path, serves
// the previous image until the blob cache expires.
const avatarPrefix = (userId: string) => `avatars/${userId}/`;

/** Deletes the user's avatars, optionally sparing a freshly uploaded one. */
const removeAvatars = async (userId: string, keepUrl?: string) => {
  const { blobs } = await list({ prefix: avatarPrefix(userId) });
  const stale = blobs.filter((blob) => blob.url !== keepUrl).map((blob) => blob.url);
  if (stale.length > 0) {
    await del(stale);
  }
};

export async function POST(request: Request) {
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

  let blob;
  try {
    // Upload the sniffed bytes as a type-less Blob rather than the original
    // File, so the stored Content-Type can only come from `imageType` — never
    // from the File's client-supplied `type`
    blob = await put(`${avatarPrefix(userId)}avatar.${imageType.extension}`, new Blob([bytes]), {
      access: "public",
      contentType: imageType.contentType,
      addRandomSuffix: true,
    });
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return new Response("Upload failed", { status: 500 });
  }

  // Sweep the previous avatars only once the new one is live, so a failed
  // upload never leaves the user with no image at all. Deliberately outside
  // the upload's catch and best-effort: the new blob is already served, and
  // failing here would withhold its URL from the client while potentially
  // having deleted the old one it still points at. An orphaned blob is the
  // better failure.
  try {
    await removeAvatars(userId, blob.url);
  } catch (error) {
    console.error("Avatar cleanup failed, leaving orphaned blobs:", error);
  }

  return Response.json({ url: blob.url });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const missingToken = requireBlobToken();
  if (missingToken) {
    return missingToken;
  }

  await removeAvatars(session.user.id);

  return new Response(null, { status: 204 });
}
