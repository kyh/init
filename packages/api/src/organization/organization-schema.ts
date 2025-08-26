import { z } from "zod";

// Input schema for getting users by a list of userIds
export const listMemberUserInput = z.object({
  userIds: z.array(z.string()),
});
export type ListMemberUserInput = z.infer<typeof listMemberUserInput>;
