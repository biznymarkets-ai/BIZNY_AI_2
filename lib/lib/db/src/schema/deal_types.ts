import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const dealTypesTable = pgTable("deal_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category"),
  industryTags: jsonb("industry_tags").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  isCustom: boolean("is_custom").notNull().default(false),
  createdBy: integer("created_by"),
  icon: text("icon"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dealFieldSchemasTable = pgTable("deal_field_schemas", {
  id: serial("id").primaryKey(),
  dealTypeId: integer("deal_type_id").notNull(),
  fieldKey: text("field_key").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type").notNull(),
  placeholder: text("placeholder"),
  helperText: text("helper_text"),
  options: jsonb("options").$type<string[]>(),
  isRequired: boolean("is_required").notNull().default(false),
  section: text("section").notNull().default("details"),
  displayOrder: integer("display_order").notNull().default(0),
  conditionalLogic: jsonb("conditional_logic"),
  validationRules: jsonb("validation_rules"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dealFieldValuesTable = pgTable("deal_field_values", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  fieldKey: text("field_key").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type").notNull(),
  value: text("value"),
  valueJson: jsonb("value_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DealType = typeof dealTypesTable.$inferSelect;
export type DealFieldSchema = typeof dealFieldSchemasTable.$inferSelect;
export type DealFieldValue = typeof dealFieldValuesTable.$inferSelect;
