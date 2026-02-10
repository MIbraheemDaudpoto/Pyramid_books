import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== Sessions table =====
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ===== Users table =====
export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email").unique(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    phone: varchar("phone", { length: 32 }),
    passwordHash: text("password_hash"),
    profileImageUrl: varchar("profile_image_url"),
    profileType: varchar("profile_type", { length: 32 }).notNull().default("individual"),
    companyName: text("company_name"),
    taxNumber: varchar("tax_number", { length: 64 }),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    role: varchar("role", { length: 32 }).notNull().default("customer"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("UQ_users_email").on(table.email)],
);

export const roles = ["admin", "salesman", "customer"] as const;
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
    linkedUserId: varchar("linked_user_id").references(() => users.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_customers_type").on(table.customerType),
    index("IDX_customers_salesman").on(table.assignedSalesmanUserId),
    index("IDX_customers_linked_user").on(table.linkedUserId),
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
    buyingPrice: numeric("buying_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
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
    discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 })
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

// ===== Stock Receipts =====
export const stockReceipts = pgTable(
  "stock_receipts",
  {
    id: serial("id").primaryKey(),
    receiptNo: varchar("receipt_no", { length: 32 }).notNull(),
    receivedByUserId: varchar("received_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    publisher: text("publisher").notNull(),
    notes: text("notes"),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("UQ_stock_receipts_receipt_no").on(table.receiptNo),
    index("IDX_stock_receipts_user").on(table.receivedByUserId),
  ],
);

export const stockReceiptItems = pgTable(
  "stock_receipt_items",
  {
    id: serial("id").primaryKey(),
    receiptId: integer("receipt_id")
      .notNull()
      .references(() => stockReceipts.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    qty: integer("qty").notNull(),
  },
  (table) => [
    index("IDX_stock_receipt_items_receipt").on(table.receiptId),
    index("IDX_stock_receipt_items_book").on(table.bookId),
  ],
);

// ===== Shopping Cart =====
export const shoppingCart = pgTable(
  "shopping_cart",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull().default(1),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_shopping_cart_user").on(table.userId),
    index("IDX_shopping_cart_book").on(table.bookId),
  ],
);

// ===== Discount Rules =====
export const discountRules = pgTable(
  "discount_rules",
  {
    id: serial("id").primaryKey(),
    ruleName: text("rule_name").notNull(),
    discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    validFrom: timestamp("valid_from"),
    validTo: timestamp("valid_to"),
    isActive: boolean("is_active").notNull().default(true),
    createdByUserId: varchar("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

// ===== School Lists =====
export const schoolLists = pgTable(
  "school_lists",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    schoolName: text("school_name"),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_school_lists_user").on(table.userId),
  ],
);

export const schoolListItems = pgTable(
  "school_list_items",
  {
    id: serial("id").primaryKey(),
    listId: integer("list_id")
      .notNull()
      .references(() => schoolLists.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    qty: integer("qty").notNull().default(1),
    notes: text("notes"),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_school_list_items_list").on(table.listId),
    index("IDX_school_list_items_book").on(table.bookId),
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
  discountPercentage: true,
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

export type CartItem = typeof shoppingCart.$inferSelect;
export type DiscountRule = typeof discountRules.$inferSelect;

export type SchoolList = typeof schoolLists.$inferSelect;
export type SchoolListItem = typeof schoolListItems.$inferSelect;

// ===== API request/response types =====
export type CurrentUserResponse =
  | (Pick<
      User,
      | "id"
      | "email"
      | "firstName"
      | "lastName"
      | "phone"
      | "profileImageUrl"
      | "profileType"
      | "companyName"
      | "taxNumber"
      | "address"
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
  discountPercentage?: number;
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
  Pick<Order, "id" | "orderNo" | "customerId" | "orderDate" | "status" | "subtotal" | "discount" | "discountPercentage" | "tax" | "total"> & {
    customerName: string;
    itemCount?: number;
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

export interface CreateStockReceiptRequest {
  publisher: string;
  items: Array<{ bookId: number; qty: number }>;
  notes?: string;
}

export type StockReceipt = typeof stockReceipts.$inferSelect;
export type StockReceiptItem = typeof stockReceiptItems.$inferSelect;

export interface StockReceiptWithItems extends StockReceipt {
  items: Array<StockReceiptItem & { bookTitle: string }>;
  receivedByName: string;
}

export type StockReceiptsListResponse = StockReceiptWithItems[];

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

export interface ReportResponse {
  salesByMonth: Array<{ month: string; total: number; count: number }>;
  topBooks: Array<{ bookId: number; title: string; totalQty: number; totalRevenue: number }>;
  topCustomers: Array<{ customerId: number; name: string; totalSpent: number; orderCount: number }>;
  outstandingBalances: Array<{ customerId: number; name: string; totalOrders: number; totalPaid: number; balance: number }>;
  salesmanPerformance: Array<{ userId: string; name: string; orderCount: number; totalSales: number }>;
}

export interface CartItemWithBook extends CartItem {
  book: Pick<Book, "id" | "title" | "isbn" | "author" | "unitPrice" | "stockQty" | "publisher">;
}

export type CartResponse = CartItemWithBook[];

export interface DiscountRulesListResponse {
  rules: DiscountRule[];
}

export interface SchoolListWithItems extends SchoolList {
  items: Array<SchoolListItem & { book: Pick<Book, "id" | "title" | "isbn" | "author" | "unitPrice"> }>;
  totalBooks: number;
  totalValue: number;
}

export type SchoolListsResponse = SchoolListWithItems[];
