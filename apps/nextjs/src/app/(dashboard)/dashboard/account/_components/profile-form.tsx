"use client";

import { useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseBrowserClient } from "@repo/db/supabase-browser-client";
import { Button } from "@repo/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Session } from "@repo/api/auth/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authClient } from "@/lib/auth-client";

type ProfileFormProps = {
  user: Session["user"];
};

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const client = getSupabaseBrowserClient();
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  const form = useForm({
    resolver: zodResolver(
      z.object({
        displayName: z.string().min(1, "Name is required"),
      }),
    ),
    defaultValues: {
      displayName: user.name,
    },
  });

  const handleUpdateProfile = form.handleSubmit(async (data) => {
    await authClient.updateUser({
      name: data.displayName,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Profile successfully updated");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  });

  const handleProfileImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingProfileImage(true);
    const id = toast.loading("Uploading profile image...");

    if (user.image) {
      await removeFileFromPublicUrl(client, user.image);
    }

    const { data: uploadData, error } = await client.storage
      .from("avatars")
      .upload(`${user.id}/${file.name}`, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      toast.error(error.message, { id });
      setIsUploadingProfileImage(false);
      return;
    }

    const publicUrl = getPublicUrl(client, uploadData.path);
    await authClient.updateUser({
      image: publicUrl,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Profile image uploaded successfully", { id });
        },
        onError: (ctx) => {
          toast.error(ctx.error.message, { id });
        },
        onResponse: () => {
          setIsUploadingProfileImage(false);
        },
      },
    });
  };

  const removeProfileImage = async () => {
    setIsUploadingProfileImage(true);
    await authClient.updateUser({
      image: "",
      fetchOptions: {
        onSuccess: () => {
          toast.success("Profile image removed successfully");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onResponse: () => {
          setIsUploadingProfileImage(false);
        },
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleUpdateProfile} className="space-y-8">
        <div className="col-span-full flex items-center gap-x-8">
          <label className="bg-secondary text-secondary-foreground hover:bg-secondary/80 relative shadow-sm">
            <input
              className="invisible absolute inset-0"
              type="file"
              onChange={handleProfileImageChange}
              disabled={isUploadingProfileImage}
            />
            {user.image ? (
              <Image
                src={user.image}
                alt="Profile picture"
                className="h-24 w-24 flex-none rounded-lg object-cover"
                width={96}
                height={96}
              />
            ) : (
              <div className="grid h-24 w-24 flex-none place-items-center rounded-lg">
                <ImageIcon />
              </div>
            )}
          </label>
          <div>
            {user.image ? (
              <Button
                variant="secondary"
                onClick={removeProfileImage}
                disabled={isUploadingProfileImage}
              >
                Remove Profile Image
              </Button>
            ) : (
              <Button
                variant="secondary"
                asChild
                loading={isUploadingProfileImage}
              >
                <label>
                  <input
                    className="invisible absolute inset-0"
                    type="file"
                    onChange={handleProfileImageChange}
                  />
                  Change Profile Image
                </label>
              </Button>
            )}
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              JPG, GIF or PNG. 1MB max.
            </p>
          </div>
        </div>
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Email</FormLabel>
          <Input placeholder="Email" value={user.email} disabled />
          <FormDescription>
            Please contact support if you need to change your email address.
          </FormDescription>
        </FormItem>
        <footer className="flex justify-end">
          <Button type="submit" loading={form.formState.isSubmitting}>
            Update Profile
          </Button>
        </footer>
      </form>
    </Form>
  );
};

const removeFileFromPublicUrl = async (
  client: SupabaseClient,
  publicUrl: string,
) => {
  const pathSegments = publicUrl.split("/avatars/");
  const filePath = pathSegments[1];

  if (!filePath) return;

  const { error } = await client.storage.from("avatars").remove([filePath]);
  if (error) console.error("Error deleting file:", error);
};

const getPublicUrl = (client: SupabaseClient, uploadPath: string) => {
  const {
    data: { publicUrl },
  } = client.storage.from("avatars").getPublicUrl(uploadPath);

  return publicUrl;
};
