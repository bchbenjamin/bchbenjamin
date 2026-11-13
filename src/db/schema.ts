import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * Schema for bchbenjamin.in.
 *
 * Two groups: the Better Auth tables (singular names and camelCase columns, as
 * Better Auth expects) and the content tables the public site and resume engine
 * read. The public site never touches these tables directly — it reads the
 * views in drizzle/sql, granted to the app_read role.
 */

/* ------------------------------- Better Auth ------------------------------ */

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("user_email_idx").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_idx").on(table.token),
    index("session_user_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("account_user_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/* --------------------------------- Content -------------------------------- */

export const itemType = pgEnum("item_type", [
  "PROJECT",
  "EXPERIENCE",
  "EDUCATION",
  "ACHIEVEMENT",
]);

const MONTH_PATTERN = "^[0-9]{4}-(0[1-9]|1[0-2])$";

export const profile = pgTable(
  "profile",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    headline: text("headline").notNull(),
    summary: text("summary").notNull(),
    email: text("email").notNull(),
    links: jsonb("links").notNull().default(sql`'[]'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("profile_single_row", sql`${table.id} = 1`)],
);

export const item = pgTable(
  "item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    type: itemType("type").notNull(),
    title: text("title").notNull(),
    org: text("org"),
    location: text("location"),
    /** yyyy-mm */
    startDate: char("start_date", { length: 7 }).notNull(),
    /** yyyy-mm, null means "present" */
    endDate: char("end_date", { length: 7 }),
    descriptionLong: text("description_long").notNull().default(""),
    summaryShort: text("summary_short").notNull().default(""),
    displayOrder: integer("display_order").notNull().default(0),
    isPublic: boolean("is_public").notNull().default(false),
    resumeEligible: boolean("resume_eligible").notNull().default(false),
    announceOnLinkedIn: boolean("announce_on_linkedin")
      .notNull()
      .default(false),
    isBeta: boolean("is_beta").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("item_slug_idx").on(table.slug),
    index("item_public_order_idx").on(table.isPublic, table.displayOrder),
    check(
      "item_start_date_month",
      sql`${table.startDate} ~ ${sql.raw(`'${MONTH_PATTERN}'`)}`,
    ),
    check(
      "item_end_date_month",
      sql`${table.endDate} is null or ${table.endDate} ~ ${sql.raw(`'${MONTH_PATTERN}'`)}`,
    ),
    check("item_end_after_start", sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`),
  ],
);

export const itemUrl = pgTable(
  "item_url",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    index("item_url_item_idx").on(table.itemId, table.displayOrder),
    check("item_url_https", sql`${table.url} ~ '^https://'`),
  ],
);

export const bullet = pgTable(
  "bullet",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [index("bullet_item_idx").on(table.itemId, table.displayOrder)],
);

export const skill = pgTable(
  "skill",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [uniqueIndex("skill_name_idx").on(table.name)],
);

export const itemSkill = pgTable(
  "item_skill",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skill.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.skillId] })],
);

/** An immutable snapshot of the resume at the moment it was published. */
export const publishedResume = pgTable(
  "published_resume",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: integer("version").notNull(),
    body: jsonb("body").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isCurrent: boolean("is_current").notNull().default(false),
  },
  (table) => [uniqueIndex("published_resume_version_idx").on(table.version)],
);

/** Every table Better Auth's Drizzle adapter should know about. */
export const schema = {
  user,
  session,
  account,
  verification,
  profile,
  item,
  itemUrl,
  bullet,
  skill,
  itemSkill,
  publishedResume,
};
