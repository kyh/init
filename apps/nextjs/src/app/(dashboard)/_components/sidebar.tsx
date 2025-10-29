"use client";

import type { Organization } from "better-auth/plugins/organization";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { slugify } from "@repo/api/auth/utils";
import { ProfileAvatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
import { Input } from "@repo/ui/input";
import { Logo } from "@repo/ui/logo";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import {
  CheckIcon,
  CheckSquareIcon,
  CreditCardIcon,
  HomeIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  Users2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Session } from "@repo/api/auth/auth";
import { authClient } from "@/auth/auth-client";
import { NavLink } from "@/components/nav";

type SidebarProps = {
  user: Session["user"];
};

export const Sidebar = ({ user }: SidebarProps) => {
  const params = useParams<{ slug: string | undefined }>();

  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const rootUrl = `/dashboard/${params.slug ?? activeOrganization?.slug}`;
  const pageLinks = [
    {
      href: rootUrl,
      label: "Home",
      exact: true,
      icon: HomeIcon,
    },
    {
      href: `${rootUrl}/todos`,
      label: "Todos",
      icon: CheckSquareIcon,
    },
    {
      href: `${rootUrl}/members`,
      label: "Members",
      icon: Users2Icon,
    },
    {
      href: `${rootUrl}/billing`,
      label: "Billing",
      icon: CreditCardIcon,
    },
    {
      href: `${rootUrl}/settings`,
      label: "Settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <nav className="sticky top-0 flex h-dvh w-[80px] flex-col items-center overflow-x-hidden overflow-y-auto px-4 py-[26px]">
      <div className="flex flex-col">
        <div className="flex justify-center pb-2">
          <NavLink href={rootUrl}>
            <Logo className="bg-muted text-primary size-10 rounded-lg" />
            <span className="sr-only">Init</span>
          </NavLink>
        </div>
        {pageLinks.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            exact={link.exact}
            className="group flex flex-col items-center gap-1 p-2 text-xs"
          >
            <span className="group-hover:bg-secondary group-data-[state=active]:bg-secondary flex size-9 items-center justify-center rounded-lg transition">
              <link.icon className="size-4" />
            </span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
      <UserDropdown
        slug={params.slug}
        user={user}
        organizations={organizations ?? []}
      />
    </nav>
  );
};

type UserDropdownProps = {
  slug?: string;
  user: Session["user"];
  organizations: Organization[];
};

const UserDropdown = ({ slug, user, organizations }: UserDropdownProps) => {
  const [isOrganizationsDialogOpen, setIsOrganizationsDialogOpen] =
    useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(z.object({ name: z.string().min(2).max(50) })),
    defaultValues: {
      name: "",
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  };

  const handleCreateOrganization = form.handleSubmit(async (data) => {
    await authClient.organization.create({
      name: data.name,
      slug: slugify(data.name),
      keepCurrentActiveOrganization: false,
      fetchOptions: {
        onSuccess: (ctx) => {
          setIsOrganizationsDialogOpen(false);
          router.push(`/dashboard/${ctx.data.slug}`);
          toast.success("Organization created successfully");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  });

  return (
    <Dialog
      open={isOrganizationsDialogOpen}
      onOpenChange={setIsOrganizationsDialogOpen}
    >
      <DropdownMenu>
        <DropdownMenuTrigger className="mt-auto cursor-pointer">
          <ProfileAvatar displayName={user.email} avatarUrl={undefined} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          forceMount
          alignOffset={8}
          sideOffset={8}
          collisionPadding={8}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm leading-none font-medium">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account">Account Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                Switch Organizations
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[300px] max-w-56 overflow-y-auto">
                {organizations.map((org) => (
                  <DropdownMenuItem key={org.id} asChild>
                    <Link
                      href={`/dashboard/${org.slug}`}
                      className="inline-flex w-full items-center font-normal"
                      onClick={() => {
                        void authClient.organization.setActive({
                          organizationId: org.id,
                        });
                      }}
                    >
                      <ProfileAvatar
                        className="size-4"
                        displayName={org.name}
                        avatarUrl={org.logo}
                      />
                      <span className="ml-2">{org.name}</span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          slug === org.slug ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DialogTrigger asChild>
                  <DropdownMenuItem className="flex w-full gap-2" asChild>
                    <button type="button">
                      <PlusIcon className="size-4" />
                      Create a Organization
                    </button>
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <button className="flex w-full gap-2" onClick={handleSignOut}>
              <LogOutIcon className="size-4" />
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new Organization to manage your projects and members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleCreateOrganization}>
            <div className="flex flex-col gap-4">
              <FormField
                name="name"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          required
                          minLength={2}
                          maxLength={50}
                          placeholder=""
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <div className="flex justify-end gap-2">
                <Button loading={form.formState.isSubmitting}>
                  Create Organization
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
