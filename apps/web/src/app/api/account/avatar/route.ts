import type { SupabaseClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth-server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

// Matches the "1MB max" copy in the profile form
const MAX_AVATAR_BYTES = 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

// Avatars live at `${userId}/avatar.<ext>`; the extension can change between
// uploads, so clear the folder rather than tracking the previous path
const removeExistingAvatars = async (client: SupabaseClient, userId: string) => {
  const { data: files } = await client.storage.from("avatars").list(userId);
  if (files && files.length > 0) {
    await client.storage.from("avatars").remove(files.map((file) => `${userId}/${file.name}`));
  }
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response("Missing file", { status: 400 });
  }

  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    return new Response("Unsupported image type", { status: 415 });
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return new Response("File too large (1MB max)", { status: 413 });
  }

  const client = getSupabaseServerClient();
  const userId = session.user.id;

  await removeExistingAvatars(client, userId);

  const path = `${userId}/avatar.${extension}`;
  const { error } = await client.storage.from("avatars").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) {
    console.error("Avatar upload failed:", error);
    return new Response("Upload failed", { status: 500 });
  }

  const { data } = client.storage.from("avatars").getPublicUrl(path);
  // The path is stable across uploads, so bust caches with a version param
  return Response.json({ url: `${data.publicUrl}?v=${Date.now()}` });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = getSupabaseServerClient();
  await removeExistingAvatars(client, session.user.id);

  return new Response(null, { status: 204 });
}
