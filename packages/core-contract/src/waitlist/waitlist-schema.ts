import { z } from "zod";

export const waitlistEmail = z.email();

export const joinWaitlistInput = z.object({
  email: waitlistEmail,
});
