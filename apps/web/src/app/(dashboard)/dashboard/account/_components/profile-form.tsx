"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@repo/ui/components/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { ImageIcon } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import type { Session } from "@repo/api/auth/auth";
import { authClient } from "@/lib/auth-client";

const avatarResponseSchema = z.object({ url: z.string() });

type ProfileFormProps = {
  user: Session["user"];
};

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  const form = useForm({
    defaultValues: {
      displayName: user.name ?? "",
    },
    validators: {
      onSubmit: z.object({
        displayName: z.string().min(1, "Name is required"),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.updateUser({
        name: value.displayName,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Profile successfully updated");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        },
      });
    },
  });

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingProfileImage(true);
    const id = toast.loading("Uploading profile image...");

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/account/avatar", { method: "POST", body: formData });

    if (!response.ok) {
      toast.error(await response.text(), { id });
      setIsUploadingProfileImage(false);
      return;
    }

    const { url } = avatarResponseSchema.parse(await response.json());
    await authClient.updateUser({
      image: url,
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

    const response = await fetch("/api/account/avatar", { method: "DELETE" });
    if (!response.ok) {
      toast.error("Failed to remove profile image");
      setIsUploadingProfileImage(false);
      return;
    }

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
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-8"
    >
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
              loading={isUploadingProfileImage}
              nativeButton={false}
              render={<label htmlFor="profile-image-upload" />}
            >
              <input
                id="profile-image-upload"
                aria-label="Change profile image"
                className="invisible absolute inset-0"
                type="file"
                onChange={handleProfileImageChange}
              />
              Change Profile Image
            </Button>
          )}
          <p className="text-muted-foreground mt-2 text-xs leading-5">JPG, GIF or PNG. 1MB max.</p>
        </div>
      </div>
      <FieldGroup className="gap-6">
        <form.Field
          name="displayName"
          validators={{
            onBlur: z.string().min(1, "Name is required"),
          }}
        >
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="gap-1">
                <FieldLabel htmlFor="profile-display-name">Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-display-name"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Your name"
                  />
                </FieldContent>
                <FieldDescription>
                  This is the name that will be displayed on your profile and in emails.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <Field className="gap-1">
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <FieldContent>
            <Input id="profile-email" placeholder="Email" value={user.email} disabled />
          </FieldContent>
          <FieldDescription>
            Please contact support if you need to change your email address.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <footer className="flex justify-end">
        <Button type="submit" loading={form.state.isSubmitting}>
          Update Profile
        </Button>
      </footer>
    </form>
  );
};
