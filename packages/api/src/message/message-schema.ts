import { z } from "zod";

/**
 * Create schema
 */
export const createMessageInput = z.object({
  content: z.string(),
  teamId: z.string(),
  role: z.enum(["app"]).optional(),
});
export type CreateMessageInput = z.infer<typeof createMessageInput>;

export const createMessagesInput = z.object({
  messages: z.array(createMessageInput),
});
export type CreateMessagesInput = z.infer<typeof createMessagesInput>;

/**
 * Read schema
 */
export const getMessageInput = z
  .object({
    id: z.string(),
  })
  .required();
export type GetMessageInput = z.infer<typeof getMessageInput>;

export const getMessagesInput = z.object({
  teamId: z.string(),
  cursor: z
    .object({
      createdAt: z.date(),
      postId: z.string(),
    })
    .optional(),
  limit: z.number().optional(),
});
export type GetMessagesInput = z.infer<typeof getMessagesInput>;

/**
 * Update schema
 */
export const updateMessageInput = z
  .object({
    id: z.string(),
  })
  .merge(createMessageInput);
export type UpdateMessageInput = z.infer<typeof updateMessageInput>;

export const updateMessagesInput = z.object({
  messages: z.array(updateMessageInput),
});
export type UpdateMessagesInput = z.infer<typeof updateMessagesInput>;

/**
 * Delete schema
 */
export const deleteMessageInput = z
  .object({
    id: z.string(),
  })
  .required();
export type DeleteMessageInput = z.infer<typeof deleteMessageInput>;

export const deleteMessagesInput = z.object({
  messages: z.array(deleteMessageInput),
});
export type DeleteMessagesInput = z.infer<typeof deleteMessagesInput>;
