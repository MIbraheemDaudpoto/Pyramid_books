import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== Replit Auth tables (mandatory) =====
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email").unique(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),

    // Pyramid Books app fields
    role: varchar("role", { length: 32 }).notNull().default("salesman"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("UQ_users_email").on(table.email)],
);

export const roles = [
  "super_admin",
  "salesman",
  "fixed_customer",
  "local_customer",
] as const;

export type Role = (typeof roles)[number];

// ===== Core domain tables =====
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    customerType: varchar("customer_type", { length: 32 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    creditLimit: numeric("credit_limit", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    assignedSalesmanUserId: varchar("assigned_salesman_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_customers_type").on(table.customerType),
    index("IDX_customers_salesman").on(table.assignedSalesmanUserId),
  ],
);

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    isbn: varchar("isbn", { length: 32 }),
    title: text("title").notNull(),
    author: text("author"),
    publisher: text("publisher"),
    category: varchar("category", { length: 64 }),
    description: text("description"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    stockQty: integer("stock_qty").notNull().default(0),
    reorderLevel: integer("reorder_level").notNull().default(10),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_books_title").on(table.title),
    index("IDX_books_isbn").on(table.isbn),
    index("IDX_books_category").on(table.category),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNo: varchar("order_no", { length: 32 }).notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    createdByUserId: varchar("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    orderDate: timestamp("order_date").notNull().defaultNow(),
    status: varchar("status", { length: 32 }).notNull().default("draft"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discount: numeric("discount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("UQ_orders_order_no").on(table.orderNo),
    index("IDX_orders_customer").on(table.customerId),
    index("IDX_orders_created_by").on(table.createdByUserId),
    index("IDX_orders_status").on(table.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    qty: integer("qty").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index("IDX_order_items_order").on(table.orderId),
    index("IDX_order_items_book").on(table.bookId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    receivedByUserId: varchar("received_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
    method: varchar("method", { length: 32 }).notNull().default("cash"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    referenceNo: varchar("reference_no", { length: 64 }),
    notes: text("notes"),
  },
  (table) => [
    index("IDX_payments_customer").on(table.customerId),
    index("IDX_payments_order").on(table.orderId),
    index("IDX_payments_received_by").on(table.receivedByUserId),
  ],
);

export const fixedCustomerUsers = pgTable(
  "fixed_customer_users",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.customerId] }),
    index("IDX_fixed_customer_users_customer").on(table.customerId),
  ],
);

// ===== Insert schemas =====
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderDate: true,
  subtotal: true,
  discount: true,
  tax: true,
  total: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  receivedAt: true,
});

// ===== Types =====
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type FixedCustomerUser = typeof fixedCustomerUsers.$inferSelect;

// ===== Explicit API request/response types =====
export type CurrentUserResponse =
  | (Pick<
      User,
      | "id"
      | "email"
      | "firstName"
      | "lastName"
      | "profileImageUrl"
      | "role"
      | "isActive"
    > & { customerId?: number | null })
  | null;

export type CreateCustomerRequest = InsertCustomer;
export type UpdateCustomerRequest = Partial<InsertCustomer>;
export type CustomerResponse = Customer;
export type CustomersListResponse = Customer[];

export type CreateBookRequest = InsertBook;
export type UpdateBookRequest = Partial<InsertBook>;
export type BookResponse = Book;
export type BooksListResponse = Book[];

export interface BooksQueryParams {
  q?: string;
  category?: string;
  lowStock?: boolean;
}

export type CreateOrderItemInput = Pick<
  InsertOrderItem,
  "bookId" | "qty" | "unitPrice" | "lineTotal"
>;

export interface CreateOrderRequest {
  customerId: number;
  items: CreateOrderItemInput[];
  discount?: number;
  tax?: number;
  notes?: string;
}

export type UpdateOrderStatusRequest = { status: string };

export interface OrderWithItemsResponse extends Order {
  items: Array<
    OrderItem & {
      book: Pick<Book, "id" | "title" | "isbn" | "author" | "unitPrice">;
    }
  >;
  customer: Pick<Customer, "id" | "name" | "customerType" | "phone" | "email">;
  createdBy: Pick<User, "id" | "email" | "firstName" | "lastName" | "role">;
}

export type OrdersListResponse = Array<
  Pick<Order, "id" | "orderNo" | "customerId" | "orderDate" | "status" | "total"> & {
    customerName: string;
  }
>;

export interface CreatePaymentRequest {
  customerId: number;
  orderId?: number | null;
  amount: number;
  method: string;
  referenceNo?: string;
  notes?: string;
}

export type PaymentsListResponse = Array<
  Payment & {
    customerName: string;
    receivedByName: string | null;
  }
>;

export interface DashboardResponse {
  kpis: {
    booksCount: number;
    lowStockCount: number;
    customersCount: number;
    openOrdersCount: number;
    sales30d: number;
    payments30d: number;
  };
  recentOrders: OrdersListResponse;
}
