import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Login History table
export const loginHistory = pgTable("login_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  device: varchar("device", { length: 100 }),
  loginMethod: varchar("login_method", { length: 50 }), // 'password', 'google', 'apple', 'microsoft', etc.
  success: boolean("success").default(true).notNull(),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"), // Additional data that might be useful
});

// User Activity table
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  activityType: varchar("activity_type", { length: 100 }).notNull(), // 'page_view', 'button_click', etc.
  details: jsonb("details"), // Details about the activity
  path: text("path"), // URL path where the activity occurred
});

// Set up relations
export const usersRelations = relations(users, ({ many }) => ({
  loginHistory: many(loginHistory),
  activities: many(userActivity),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
});

// Types for TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginHistory = typeof loginHistory.$inferSelect;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
