import { defineRelations } from "drizzle-orm";

import * as schema from "./drizzle-schema";
import * as schemaAuth from "./drizzle-schema-auth";

// One relation graph over both schema files. It powers `db.query.*` and is how
// better-auth's adapter finds each table, so every table must be in `schema`
// here even when it declares no relation.
export const relations = defineRelations({ ...schemaAuth, ...schema }, (r) => ({
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  invitation: {
    organization: r.one.organization({ from: r.invitation.organizationId, to: r.organization.id }),
    user: r.one.user({ from: r.invitation.inviterId, to: r.user.id }),
  },
  member: {
    organization: r.one.organization({ from: r.member.organizationId, to: r.organization.id }),
    user: r.one.user({ from: r.member.userId, to: r.user.id }),
  },
  organization: {
    invitations: r.many.invitation({ from: r.organization.id, to: r.invitation.organizationId }),
    members: r.many.member({ from: r.organization.id, to: r.member.organizationId }),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  todo: {
    organization: r.one.organization({ from: r.todo.organizationId, to: r.organization.id }),
  },
  user: {
    accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
    invitations: r.many.invitation({ from: r.user.id, to: r.invitation.inviterId }),
    members: r.many.member({ from: r.user.id, to: r.member.userId }),
    sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
  },
  waitlist: {
    user: r.one.user({ from: r.waitlist.userId, to: r.user.id }),
  },
}));

export type Relations = typeof relations;
