"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { FieldGroup } from "@repo/ui/components/field";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "cn";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useAppForm } from "@/lib/form";

const CODE_LENGTH = 6;

const emailSchema = z.email("Invalid email address");

const codeSchema = z
  .string()
  .regex(new RegExp(`^\\d{${CODE_LENGTH}}$`, "u"), `Enter the ${CODE_LENGTH}-digit code`);

const CODE_ERRORS = new Map([
  ["INVALID_OTP", "That code isn't right. Check it and try again."],
  ["OTP_EXPIRED", "That code has expired. Send a new one."],
  ["TOO_MANY_ATTEMPTS", "Too many tries. Send a new code."],
]);

const errorMessageOf = (error: { code?: string; message?: string }) =>
  CODE_ERRORS.get(error.code ?? "") ?? error.message ?? "Something went wrong. Try again.";

const sendCode = async (email: string) => {
  const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });

  if (error) {
    toast.error(errorMessageOf(error));
  }

  return error === null;
};

const EmailStep = ({ onSent }: { onSent: (email: string) => void }) => {
  const form = useAppForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      if (await sendCode(value.email)) {
        onSent(value.email);
      }
    },
    validators: {
      onSubmit: z.object({ email: emailSchema }),
    },
  });

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-2">
        <form.AppField name="email" validators={{ onBlur: emailSchema }}>
          {(field) => (
            <field.TextField
              label="Email"
              labelClassName="sr-only"
              data-test="email-input"
              required
              type="email"
              placeholder="name@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
            />
          )}
        </form.AppField>
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton>Continue with email</form.SubmitButton>
      </form.AppForm>
    </form>
  );
};

const CodeStep = ({
  email,
  nextPath,
  onBack,
}: {
  email: string;
  nextPath: string;
  onBack: () => void;
}) => {
  const router = useRouter();
  const [resending, setResending] = useState(false);

  const form = useAppForm({
    defaultValues: {
      code: "",
    },
    onSubmit: async ({ value }) => {
      const [emailPrefix] = email.split("@");

      const { error } = await authClient.signIn.emailOtp({
        email,
        name: emailPrefix ?? "User",
        otp: value.code,
      });

      if (error) {
        toast.error(errorMessageOf(error));

        return;
      }

      router.replace(nextPath);
    },
    validators: {
      onSubmit: z.object({ code: codeSchema }),
    },
  });

  const resend = async () => {
    setResending(true);

    if (await sendCode(email)) {
      toast.success(`Sent a new code to ${email}`);
    }

    setResending(false);
  };

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p className="text-muted-foreground text-center text-sm">
        We sent a {CODE_LENGTH}-digit code to <span className="text-foreground">{email}</span>.
      </p>
      <FieldGroup className="gap-2">
        <form.AppField name="code">
          {(field) => (
            <field.TextField
              label="Sign-in code"
              labelClassName="sr-only"
              data-test="code-input"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={CODE_LENGTH}
              placeholder={"0".repeat(CODE_LENGTH)}
              autoComplete="one-time-code"
              inputClassName="text-center font-mono tracking-[0.5em]"
            />
          )}
        </form.AppField>
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton>Sign in</form.SubmitButton>
      </form.AppForm>
      <div className="flex justify-between">
        <Button variant="link" size="sm" type="button" onClick={onBack}>
          Use a different email
        </Button>
        <Button
          variant="link"
          size="sm"
          type="button"
          loading={resending}
          onClick={() => {
            void resend();
          }}
        >
          Resend code
        </Button>
      </div>
    </form>
  );
};

type AuthFormProps = {
  nextPath: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const AuthForm = ({ className, nextPath, ...props }: AuthFormProps) => {
  const [submittingGithub, setSubmittingGithub] = useState(false);
  const [email, setEmail] = useState<string>();

  const handleAuthWithGithub = async () => {
    setSubmittingGithub(true);
    await authClient.signIn.social({
      callbackURL: nextPath,
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onResponse: () => {
          setSubmittingGithub(false);
        },
      },
      provider: "github",
    });
  };

  if (email !== undefined) {
    return (
      <div className={cn("grid gap-6", className)} {...props}>
        <CodeStep
          email={email}
          nextPath={nextPath}
          onBack={() => {
            setEmail(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Button
        variant="outline"
        type="button"
        loading={submittingGithub}
        onClick={() => {
          void handleAuthWithGithub();
        }}
      >
        Continue with Github
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">Or</span>
        </div>
      </div>
      <EmailStep onSent={setEmail} />
    </div>
  );
};
