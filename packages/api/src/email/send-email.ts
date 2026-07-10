type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Sends transactional email through Resend's REST API (no SDK dependency).
 * Without RESEND_API_KEY the email is logged to the server console instead —
 * dev-friendly, and never a silent drop.
 */
export const sendEmail = async ({ to, subject, text }: SendEmailInput) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY not set — logging instead of sending\nto: ${to}\nsubject: ${subject}\n${text}`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email (${response.status}): ${await response.text()}`);
  }
};
