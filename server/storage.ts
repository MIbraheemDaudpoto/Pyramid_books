import { and, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import {
  books,
  customers,
  discountRules,
  orderItems,
  orders,
  passwordResetTokens,
  payments,
  schoolLists,
  schoolListItems,
  shoppingCart,
  stockReceipts,
  stockReceiptItems,
  users,
  type Book,
  type CartResponse,
  type CreateBookRequest,
  type CreateCustomerRequest,
  type CreateOrderRequest,
  type CreatePaymentRequest,
  type CreateStockReceiptRequest,
  type Customer,
  type CurrentUserResponse,
  type DashboardResponse,
  type DiscountRule,
  type OrderWithItemsResponse,
  type OrdersListResponse,
  type PasswordResetToken,
  type PaymentsListResponse,
  type ReportResponse,
  type Role,
  type StockReceiptWithItems,
  type StockReceiptsListResponse,
  type UpdateBookRequest,
  type UpdateCustomerRequest,
  type UpdateOrderStatusRequest,
  type User,
} from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getCurrentUser(userId: string): Promise<CurrentUserResponse>;

  listUsers(): Promise<
    Array<{
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      role: Role;
      isActive: boolean;
      customerId?: number | null;
    }>
  >;
  updateUser(
    id: string,
    updates: { role?: Role; isActive?: boolean; customerId?: number | null },
  ): Promise<{ id: string; role: Role; isActive: boolean; customerId?: number | null }>;

  findUserByEmail(email: string): Promise<User | undefined>;
  getDashboard(userId: string): Promise<DashboardResponse>;

  listCustomersForUser(userId: string): Promise<Customer[]>;
  createCustomer(input: CreateCustomerRequest): Promise<Customer>;
  updateCustomer(id: number, updates: UpdateCustomerRequest): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  listBooks(params?: {
    q?: string;
    category?: string;
    lowStock?: boolean;
  }): Promise<Book[]>;
  createBook(input: CreateBookRequest): Promise<Book>;
  updateBook(id: number, updates: UpdateBookRequest): Promise<Book>;
  deleteBook(id: number): Promise<void>;

  listOrdersForUser(userId: string): Promise<OrdersListResponse>;
  getOrderForUser(userId: string, id: number): Promise<OrderWithItemsResponse | undefined>;
  createOrder(userId: string, input: CreateOrderRequest): Promise<OrderWithItemsResponse>;
  updateOrderStatus(
    userId: string,
    id: number,
    input: UpdateOrderStatusRequest,
  ): Promise<OrderWithItemsResponse>;

  listPaymentsForUser(userId: string): Promise<PaymentsListResponse>;
  createPayment(userId: string, input: CreatePaymentRequest): Promise<number>;

  listStockReceipts(): Promise<StockReceiptsListResponse>;
  createStockReceipt(userId: string, input: CreateStockReceiptRequest): Promise<StockReceiptWithItems>;
  getReports(from?: string, to?: string): Promise<ReportResponse>;

  listCartItems(userId: string): Promise<CartResponse>;
  addToCart(userId: string, bookId: number, qty: number): Promise<CartResponse>;
  updateCartItem(userId: string, cartItemId: number, qty: number): Promise<CartResponse>;
  removeCartItem(userId: string, cartItemId: number): Promise<CartResponse>;
  clearCart(userId: string): Promise<void>;
  checkoutCart(userId: string, notes?: string): Promise<OrderWithItemsResponse>;

  listDiscountRules(): Promise<DiscountRule[]>;
  createDiscountRule(userId: string, input: any): Promise<DiscountRule>;
  deleteDiscountRule(id: number): Promise<void>;
  findBestDiscount(subtotal: number): Promise<number>;

  listSchoolLists(userId: string): Promise<any[]>;
  createSchoolList(userId: string, input: { name: string; schoolName?: string | null; description?: string | null }): Promise<any>;
  updateSchoolList(userId: string, listId: number, input: { name?: string; schoolName?: string | null; description?: string | null }): Promise<any>;
  deleteSchoolList(userId: string, listId: number): Promise<void>;
  addSchoolListItem(userId: string, listId: number, input: { bookId: number; qty: number; notes?: string | null }): Promise<any>;
  updateSchoolListItem(userId: string, listId: number, itemId: number, input: { qty?: number; notes?: string | null }): Promise<any>;
  removeSchoolListItem(userId: string, listId: number, itemId: number): Promise<any>;
  addSchoolListToCart(userId: string, listId: number): Promise<void>;

  updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    profileType?: string;
    companyName?: string | null;
    taxNumber?: string | null;
    address?: string | null;
  }): Promise<CurrentUserResponse>;
  getUserWithPassword(userId: string): Promise<{ passwordHash: string | null } | null>;
  updatePassword(userId: string, hash: string): Promise<void>;

  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<(PasswordResetToken & { userEmail: string | null }) | null>;
  markTokenUsed(tokenId: number): Promise<void>;
  listPendingPasswordResets(): Promise<Array<{ id: number; token: string; userEmail: string | null; userName: string | null; expiresAt: Date; createdAt: Date }>>;

  seedIfEmpty(): Promise<void>;
}

function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value);
}

function nameOf(u: { firstName: string | null; lastName: string | null; email: string | null }): string {
  const name = [u.firstName ?? "", u.lastName ?? ""].join(" ").trim();
  return name.length > 0 ? name : u.email ?? "Unknown";
}

export class DatabaseStorage implements IStorage {
  async findUserByEmail(email: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u;
  }

  async getCurrentUser(userId: string): Promise<CurrentUserResponse> {
    const [u] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        profileImageUrl: users.profileImageUrl,
        profileType: users.profileType,
        companyName: users.companyName,
        taxNumber: users.taxNumber,
        address: users.address,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!u) return null;

    const [linked] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.linkedUserId, userId));

    return {
      ...u,
      role: u.role as Role,
      customerId: linked?.id ?? null,
    } as CurrentUserResponse;
  }

  async listUsers() {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const linkedCustomers = await db
      .select({ linkedUserId: customers.linkedUserId, id: customers.id })
      .from(customers)
      .where(sql`${customers.linkedUserId} IS NOT NULL`);

    const linkedMap = new Map<string, number>();
    linkedCustomers.forEach((c) => { if (c.linkedUserId) linkedMap.set(c.linkedUserId, c.id); });

    return rows.map((r) => ({ ...r, role: r.role as Role, customerId: linkedMap.get(r.id) ?? null }));
  }

  async updateUser(id: string, updates: { role?: Role; isActive?: boolean; customerId?: number | null }) {
    const [existing] = await db.select().from(users).where(eq(users.id, id));
    if (!existing) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    const nextRole = updates.role ?? (existing.role as Role);
    const nextActive = updates.isActive ?? existing.isActive;

    const [updated] = await db
      .update(users)
      .set({
        role: nextRole,
        isActive: nextActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id, role: users.role, isActive: users.isActive });

    if (updates.customerId !== undefined) {
      await db
        .update(customers)
        .set({ linkedUserId: null })
        .where(eq(customers.linkedUserId, id));

      if (updates.customerId !== null) {
        await db
          .update(customers)
          .set({ linkedUserId: id })
          .where(eq(customers.id, updates.customerId));
      }
    }

    const [linked] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.linkedUserId, id));

    return { ...updated, role: updated.role as Role, customerId: linked?.id ?? null };
  }

  async listCustomersForUser(userId: string): Promise<Customer[]> {
    const me = await this.getCurrentUser(userId);
    if (!me) return [];

    if (me.role === "admin") {
      return await db.select().from(customers).orderBy(desc(customers.createdAt));
    }

    if (me.role === "salesman") {
      return await db
        .select()
        .from(customers)
        .where(eq(customers.assignedSalesmanUserId, userId))
        .orderBy(desc(customers.createdAt));
    }

    if (me.role === "customer") {
      if (!me.customerId) return [];
      const [c] = await db.select().from(customers).where(eq(customers.id, me.customerId));
      return c ? [c] : [];
    }

    return [];
  }

  async createCustomer(input: CreateCustomerRequest): Promise<Customer> {
    const [created] = await db.insert(customers).values(input).returning();
    return created;
  }

  async updateCustomer(id: number, updates: UpdateCustomerRequest): Promise<Customer> {
    const [existing] = await db.select().from(customers).where(eq(customers.id, id));
    if (!existing) {
      throw Object.assign(new Error("Customer not found"), { status: 404 });
    }
    const [updated] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return updated;
  }

  async deleteCustomer(id: number): Promise<void> {
    const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, id));
    if (!existing) {
      throw Object.assign(new Error("Customer not found"), { status: 404 });
    }
    await db.delete(customers).where(eq(customers.id, id));
  }

  async listBooks(params?: { q?: string; category?: string; lowStock?: boolean }): Promise<Book[]> {
    const where: any[] = [eq(books.isActive, true)];

    if (params?.q) {
      where.push(ilike(books.title, `%${params.q}%`));
    }
    if (params?.category) {
      where.push(eq(books.category, params.category));
    }
    if (params?.lowStock) {
      where.push(sql`${books.stockQty} <= ${books.reorderLevel}`);
    }

    return await db
      .select()
      .from(books)
      .where(and(...where))
      .orderBy(desc(books.createdAt));
  }

  async createBook(input: CreateBookRequest): Promise<Book> {
    const [created] = await db.insert(books).values(input).returning();
    return created;
  }

  async updateBook(id: number, updates: UpdateBookRequest): Promise<Book> {
    const [existing] = await db.select({ id: books.id }).from(books).where(eq(books.id, id));
    if (!existing) {
      throw Object.assign(new Error("Book not found"), { status: 404 });
    }
    const [updated] = await db.update(books).set(updates).where(eq(books.id, id)).returning();
    return updated;
  }

  async deleteBook(id: number): Promise<void> {
    const [existing] = await db.select({ id: books.id }).from(books).where(eq(books.id, id));
    if (!existing) {
      throw Object.assign(new Error("Book not found"), { status: 404 });
    }
    await db.delete(books).where(eq(books.id, id));
  }

  async listOrdersForUser(userId: string): Promise<OrdersListResponse> {
    const me = await this.getCurrentUser(userId);
    if (!me) return [] as any;

    let whereClause;
    if (me.role === "admin") {
      whereClause = undefined;
    } else if (me.role === "salesman") {
      whereClause = eq(orders.createdByUserId, userId);
    } else if (me.role === "customer") {
      if (me.customerId) {
        whereClause = sql`(${orders.customerId} = ${me.customerId} OR ${orders.createdByUserId} = ${userId})`;
      } else {
        whereClause = eq(orders.createdByUserId, userId);
      }
    } else {
      whereClause = sql`false`;
    }

    const base = db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        customerId: orders.customerId,
        orderDate: orders.orderDate,
        status: orders.status,
        subtotal: orders.subtotal,
        discount: orders.discount,
        discountPercentage: orders.discountPercentage,
        tax: orders.tax,
        total: orders.total,
        customerName: customers.name,
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .orderBy(desc(orders.orderDate));

    const rows = whereClause ? await base.where(whereClause) : await base;
    return rows as any;
  }

  async getOrderForUser(userId: string, id: number): Promise<OrderWithItemsResponse | undefined> {
    const me = await this.getCurrentUser(userId);
    if (!me) return undefined;

    const [o] = await db.select().from(orders).where(eq(orders.id, id));
    if (!o) return undefined;

    const canView =
      me.role === "admin" ||
      (me.role === "salesman" && o.createdByUserId === userId) ||
      (me.role === "customer" && (o.createdByUserId === userId || (me.customerId && o.customerId === me.customerId)));

    if (!canView) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    const [customer] = await db
      .select({
        id: customers.id,
        name: customers.name,
        customerType: customers.customerType,
        phone: customers.phone,
        email: customers.email,
      })
      .from(customers)
      .where(eq(customers.id, o.customerId));

    const [createdBy] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, o.createdByUserId));

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        bookId: orderItems.bookId,
        qty: orderItems.qty,
        unitPrice: orderItems.unitPrice,
        lineTotal: orderItems.lineTotal,
        book: {
          id: books.id,
          title: books.title,
          isbn: books.isbn,
          author: books.author,
          unitPrice: books.unitPrice,
        },
      })
      .from(orderItems)
      .innerJoin(books, eq(books.id, orderItems.bookId))
      .where(eq(orderItems.orderId, o.id));

    return {
      ...(o as any),
      items: items.map((it) => ({
        id: it.id,
        orderId: it.orderId,
        bookId: it.bookId,
        qty: it.qty,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        book: it.book,
      })),
      customer: customer as any,
      createdBy: createdBy as any,
    };
  }

  async createOrder(userId: string, input: CreateOrderRequest): Promise<OrderWithItemsResponse> {
    const me = await this.getCurrentUser(userId);
    if (!me) {
      throw Object.assign(new Error("Unauthorized"), { status: 401 });
    }

    const canCreate = me.role === "admin" || me.role === "salesman";
    if (!canCreate) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    if (me.role === "salesman") {
      const [cust] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, input.customerId), eq(customers.assignedSalesmanUserId, userId)));
      if (!cust) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
      }
    }

    const bookIds = input.items.map((i) => i.bookId);
    const bookRows = await db
      .select({ id: books.id, unitPrice: books.unitPrice, stockQty: books.stockQty, title: books.title })
      .from(books)
      .where(inArray(books.id, bookIds));

    const bookMap = new Map<number, { unitPrice: any; stockQty: number; title: string }>();
    bookRows.forEach((b) => bookMap.set(b.id, { unitPrice: b.unitPrice, stockQty: b.stockQty, title: b.title }));

    let subtotal = 0;
    for (const item of input.items) {
      const b = bookMap.get(item.bookId);
      if (!b) {
        throw Object.assign(new Error("Book not found"), { status: 400 });
      }
      const qty = toNumber(item.qty);
      const unit = toNumber(item.unitPrice);
      const line = toNumber(item.lineTotal);
      if (qty <= 0) {
        throw Object.assign(new Error("Quantity must be positive"), { status: 400 });
      }
      if (b.stockQty < qty) {
        throw Object.assign(new Error(`Insufficient stock for ${b.title}`), { status: 400 });
      }
      if (Math.abs(line - qty * unit) > 0.01) {
        throw Object.assign(new Error("Line total mismatch"), { status: 400 });
      }
      subtotal += line;
    }

    let discountPercentage = input.discountPercentage ?? 0;
    let discount = input.discount ?? 0;
    if (discountPercentage > 0) {
      discount = subtotal * discountPercentage / 100;
    }
    const tax = input.tax ?? 0;
    const total = subtotal - discount + tax;

    const orderNo = `PB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`;

    const [created] = await db
      .insert(orders)
      .values({
        orderNo,
        customerId: input.customerId,
        createdByUserId: userId,
        status: "confirmed",
        subtotal: String(subtotal) as any,
        discountPercentage: String(discountPercentage) as any,
        discount: String(discount) as any,
        tax: String(tax) as any,
        total: String(total) as any,
        notes: input.notes,
      })
      .returning();

    for (const item of input.items) {
      await db.insert(orderItems).values({
        orderId: created.id,
        bookId: item.bookId,
        qty: toNumber(item.qty),
        unitPrice: String(item.unitPrice) as any,
        lineTotal: String(item.lineTotal) as any,
      });

      await db
        .update(books)
        .set({ stockQty: sql`${books.stockQty} - ${toNumber(item.qty)}` })
        .where(eq(books.id, item.bookId));
    }

    const full = await this.getOrderForUser(userId, created.id);
    if (!full) {
      throw Object.assign(new Error("Order not found"), { status: 500 });
    }
    return full;
  }

  async updateOrderStatus(userId: string, id: number, input: UpdateOrderStatusRequest): Promise<OrderWithItemsResponse> {
    const me = await this.getCurrentUser(userId);
    if (!me) {
      throw Object.assign(new Error("Unauthorized"), { status: 401 });
    }

    const [o] = await db.select().from(orders).where(eq(orders.id, id));
    if (!o) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    const canUpdate =
      me.role === "admin" || (me.role === "salesman" && o.createdByUserId === userId);

    if (!canUpdate) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    await db.update(orders).set({ status: input.status }).where(eq(orders.id, id));

    const full = await this.getOrderForUser(userId, id);
    if (!full) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }
    return full;
  }

  async listPaymentsForUser(userId: string): Promise<PaymentsListResponse> {
    const me = await this.getCurrentUser(userId);
    if (!me) return [] as any;

    let customerFilterIds: number[] | null = null;

    if (me.role === "customer") {
      customerFilterIds = me.customerId ? [me.customerId] : [];
    }

    const q = db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        customerId: payments.customerId,
        receivedByUserId: payments.receivedByUserId,
        receivedAt: payments.receivedAt,
        method: payments.method,
        amount: payments.amount,
        referenceNo: payments.referenceNo,
        notes: payments.notes,
        customerName: customers.name,
        receivedByFirstName: users.firstName,
        receivedByLastName: users.lastName,
        receivedByEmail: users.email,
      })
      .from(payments)
      .innerJoin(customers, eq(customers.id, payments.customerId))
      .leftJoin(users, eq(users.id, payments.receivedByUserId))
      .orderBy(desc(payments.receivedAt));

    const rows = customerFilterIds ? await q.where(inArray(payments.customerId, customerFilterIds)) : await q;

    return rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      customerId: r.customerId,
      receivedByUserId: r.receivedByUserId,
      receivedAt: r.receivedAt,
      method: r.method,
      amount: r.amount,
      referenceNo: r.referenceNo,
      notes: r.notes,
      customerName: r.customerName,
      receivedByName: r.receivedByUserId
        ? nameOf({
            firstName: r.receivedByFirstName,
            lastName: r.receivedByLastName,
            email: r.receivedByEmail,
          })
        : null,
    })) as any;
  }

  async createPayment(userId: string, input: CreatePaymentRequest): Promise<number> {
    const me = await this.getCurrentUser(userId);
    if (!me) {
      throw Object.assign(new Error("Unauthorized"), { status: 401 });
    }

    const canCreate = me.role === "admin" || me.role === "salesman";
    if (!canCreate) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    if (me.role === "salesman") {
      const [cust] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, input.customerId), eq(customers.assignedSalesmanUserId, userId)));
      if (!cust) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
      }
    }

    const [created] = await db
      .insert(payments)
      .values({
        customerId: input.customerId,
        orderId: input.orderId ?? null,
        receivedByUserId: userId,
        amount: String(input.amount) as any,
        method: input.method,
        referenceNo: input.referenceNo,
        notes: input.notes,
      })
      .returning({ id: payments.id });

    return created.id;
  }

  async listStockReceipts(): Promise<StockReceiptsListResponse> {
    const receipts = await db
      .select({
        id: stockReceipts.id,
        receiptNo: stockReceipts.receiptNo,
        receivedByUserId: stockReceipts.receivedByUserId,
        publisher: stockReceipts.publisher,
        notes: stockReceipts.notes,
        receivedAt: stockReceipts.receivedAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(stockReceipts)
      .innerJoin(users, eq(users.id, stockReceipts.receivedByUserId))
      .orderBy(desc(stockReceipts.receivedAt));

    const result: StockReceiptsListResponse = [];
    for (const r of receipts) {
      const items = await db
        .select({
          id: stockReceiptItems.id,
          receiptId: stockReceiptItems.receiptId,
          bookId: stockReceiptItems.bookId,
          qty: stockReceiptItems.qty,
          bookTitle: books.title,
        })
        .from(stockReceiptItems)
        .innerJoin(books, eq(books.id, stockReceiptItems.bookId))
        .where(eq(stockReceiptItems.receiptId, r.id));

      result.push({
        id: r.id,
        receiptNo: r.receiptNo,
        receivedByUserId: r.receivedByUserId,
        publisher: r.publisher,
        notes: r.notes,
        receivedAt: r.receivedAt,
        receivedByName: nameOf({
          firstName: r.userFirstName,
          lastName: r.userLastName,
          email: r.userEmail,
        }),
        items,
      });
    }

    return result;
  }

  async createStockReceipt(userId: string, input: CreateStockReceiptRequest): Promise<StockReceiptWithItems> {
    const receiptNo = `SR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`;

    const [created] = await db
      .insert(stockReceipts)
      .values({
        receiptNo,
        receivedByUserId: userId,
        publisher: input.publisher,
        notes: input.notes,
      })
      .returning();

    const insertedItems: Array<{ id: number; receiptId: number; bookId: number; qty: number; bookTitle: string }> = [];

    for (const item of input.items) {
      const [inserted] = await db
        .insert(stockReceiptItems)
        .values({
          receiptId: created.id,
          bookId: item.bookId,
          qty: item.qty,
        })
        .returning();

      await db
        .update(books)
        .set({ stockQty: sql`${books.stockQty} + ${item.qty}` })
        .where(eq(books.id, item.bookId));

      const [book] = await db.select({ title: books.title }).from(books).where(eq(books.id, item.bookId));
      insertedItems.push({ ...inserted, bookTitle: book?.title ?? "Unknown" });
    }

    const [u] = await db
      .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(eq(users.id, userId));

    return {
      ...created,
      receivedByName: nameOf({ firstName: u?.firstName ?? null, lastName: u?.lastName ?? null, email: u?.email ?? null }),
      items: insertedItems,
    };
  }

  async getReports(from?: string, to?: string): Promise<ReportResponse> {
    const dateFilters: any[] = [];
    if (from) {
      dateFilters.push(gte(orders.orderDate, new Date(from)));
    }
    if (to) {
      dateFilters.push(lte(orders.orderDate, new Date(to)));
    }

    const orderWhere = dateFilters.length > 0 ? and(...dateFilters) : undefined;

    const salesByMonthRows = await db
      .select({
        month: sql<string>`to_char(${orders.orderDate}, 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${orders.total}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(orderWhere)
      .groupBy(sql`to_char(${orders.orderDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.orderDate}, 'YYYY-MM')`);

    const salesByMonth = salesByMonthRows.map((r) => ({
      month: r.month,
      total: Number(r.total),
      count: Number(r.count),
    }));

    let topBooksQuery = db
      .select({
        bookId: orderItems.bookId,
        title: books.title,
        totalQty: sql<number>`coalesce(sum(${orderItems.qty}), 0)`,
        totalRevenue: sql<number>`coalesce(sum(${orderItems.lineTotal}), 0)`,
      })
      .from(orderItems)
      .innerJoin(books, eq(books.id, orderItems.bookId))
      .innerJoin(orders, eq(orders.id, orderItems.orderId));

    if (orderWhere) {
      topBooksQuery = topBooksQuery.where(orderWhere) as any;
    }

    const topBooksRows = await (topBooksQuery as any)
      .groupBy(orderItems.bookId, books.title)
      .orderBy(sql`sum(${orderItems.lineTotal}) desc`)
      .limit(10);

    const topBooks = topBooksRows.map((r: any) => ({
      bookId: r.bookId,
      title: r.title,
      totalQty: Number(r.totalQty),
      totalRevenue: Number(r.totalRevenue),
    }));

    let topCustomersQuery = db
      .select({
        customerId: orders.customerId,
        name: customers.name,
        totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId));

    if (orderWhere) {
      topCustomersQuery = topCustomersQuery.where(orderWhere) as any;
    }

    const topCustomersRows = await (topCustomersQuery as any)
      .groupBy(orders.customerId, customers.name)
      .orderBy(sql`sum(${orders.total}) desc`)
      .limit(10);

    const topCustomers = topCustomersRows.map((r: any) => ({
      customerId: r.customerId,
      name: r.name,
      totalSpent: Number(r.totalSpent),
      orderCount: Number(r.orderCount),
    }));

    const allCustomers = await db.select({ id: customers.id, name: customers.name }).from(customers);

    const outstandingBalances: ReportResponse["outstandingBalances"] = [];
    for (const c of allCustomers) {
      const [{ total: totalOrders }] = await db
        .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(eq(orders.customerId, c.id));

      const [{ total: totalPaid }] = await db
        .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
        .from(payments)
        .where(eq(payments.customerId, c.id));

      const tOrders = Number(totalOrders);
      const tPaid = Number(totalPaid);
      const balance = tOrders - tPaid;
      if (balance !== 0) {
        outstandingBalances.push({
          customerId: c.id,
          name: c.name,
          totalOrders: tOrders,
          totalPaid: tPaid,
          balance,
        });
      }
    }

    let salesmanQuery = db
      .select({
        userId: orders.createdByUserId,
        orderCount: sql<number>`count(*)`,
        totalSales: sql<number>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders);

    if (orderWhere) {
      salesmanQuery = salesmanQuery.where(orderWhere) as any;
    }

    const salesmanRows = await (salesmanQuery as any)
      .groupBy(orders.createdByUserId);

    const salesmanPerformance: ReportResponse["salesmanPerformance"] = [];
    for (const row of salesmanRows as any[]) {
      const [u] = await db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(eq(users.id, row.userId));
      salesmanPerformance.push({
        userId: row.userId,
        name: u ? nameOf(u) : "Unknown",
        orderCount: Number(row.orderCount),
        totalSales: Number(row.totalSales),
      });
    }

    return {
      salesByMonth,
      topBooks,
      topCustomers,
      outstandingBalances,
      salesmanPerformance,
    };
  }

  async getDashboard(userId: string): Promise<DashboardResponse> {
    const me = await this.getCurrentUser(userId);
    if (!me) {
      throw Object.assign(new Error("Unauthorized"), { status: 401 });
    }

    const [{ count: booksCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(eq(books.isActive, true));

    const [{ count: lowStockCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(and(eq(books.isActive, true), sql`${books.stockQty} <= ${books.reorderLevel}`));

    const [{ count: customersCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.isActive, true));

    const openStatuses = ["draft", "confirmed", "shipped"];
    const [{ count: openOrdersCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.status, openStatuses));

    const since = sql`now() - interval '30 days'`;

    const [{ sum: sales30d }] = await db
      .select({ sum: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(sql`${orders.orderDate} >= ${since}`);

    const [{ sum: payments30d }] = await db
      .select({ sum: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(sql`${payments.receivedAt} >= ${since}`);

    const recentOrders = await this.listOrdersForUser(userId);

    return {
      kpis: {
        booksCount,
        lowStockCount,
        customersCount,
        openOrdersCount,
        sales30d,
        payments30d,
      },
      recentOrders: recentOrders.slice(0, 8),
    };
  }

  private async _getCartItems(userId: string): Promise<CartResponse> {
    const rows = await db
      .select({
        id: shoppingCart.id,
        userId: shoppingCart.userId,
        bookId: shoppingCart.bookId,
        qty: shoppingCart.qty,
        addedAt: shoppingCart.addedAt,
        book: {
          id: books.id,
          title: books.title,
          isbn: books.isbn,
          author: books.author,
          unitPrice: books.unitPrice,
          stockQty: books.stockQty,
          publisher: books.publisher,
        },
      })
      .from(shoppingCart)
      .innerJoin(books, eq(books.id, shoppingCart.bookId))
      .where(eq(shoppingCart.userId, userId))
      .orderBy(desc(shoppingCart.addedAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      bookId: r.bookId,
      qty: r.qty,
      addedAt: r.addedAt,
      book: r.book,
    }));
  }

  async listCartItems(userId: string): Promise<CartResponse> {
    return this._getCartItems(userId);
  }

  async addToCart(userId: string, bookId: number, qty: number): Promise<CartResponse> {
    const [existing] = await db
      .select()
      .from(shoppingCart)
      .where(and(eq(shoppingCart.userId, userId), eq(shoppingCart.bookId, bookId)));

    if (existing) {
      await db
        .update(shoppingCart)
        .set({ qty: existing.qty + qty })
        .where(eq(shoppingCart.id, existing.id));
    } else {
      await db.insert(shoppingCart).values({ userId, bookId, qty });
    }

    return this._getCartItems(userId);
  }

  async updateCartItem(userId: string, cartItemId: number, qty: number): Promise<CartResponse> {
    const [existing] = await db
      .select()
      .from(shoppingCart)
      .where(and(eq(shoppingCart.id, cartItemId), eq(shoppingCart.userId, userId)));

    if (!existing) {
      throw Object.assign(new Error("Cart item not found"), { status: 404 });
    }

    await db.update(shoppingCart).set({ qty }).where(eq(shoppingCart.id, cartItemId));
    return this._getCartItems(userId);
  }

  async removeCartItem(userId: string, cartItemId: number): Promise<CartResponse> {
    const [existing] = await db
      .select()
      .from(shoppingCart)
      .where(and(eq(shoppingCart.id, cartItemId), eq(shoppingCart.userId, userId)));

    if (!existing) {
      throw Object.assign(new Error("Cart item not found"), { status: 404 });
    }

    await db.delete(shoppingCart).where(eq(shoppingCart.id, cartItemId));
    return this._getCartItems(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(shoppingCart).where(eq(shoppingCart.userId, userId));
  }

  async checkoutCart(userId: string, notes?: string): Promise<OrderWithItemsResponse> {
    const me = await this.getCurrentUser(userId);
    if (!me) {
      throw Object.assign(new Error("Unauthorized"), { status: 401 });
    }

    const cartItems = await this._getCartItems(userId);
    if (cartItems.length === 0) {
      throw Object.assign(new Error("Cart is empty"), { status: 400 });
    }

    let customerId: number;

    if (me.role === "customer") {
      if (me.customerId) {
        customerId = me.customerId;
      } else {
        const [autoCreated] = await db
          .insert(customers)
          .values({
            name: [me.firstName ?? "", me.lastName ?? ""].join(" ").trim() || me.email || "Customer",
            customerType: "customer",
            phone: null,
            email: me.email,
            address: null,
            creditLimit: "0",
            notes: "Auto-created from cart checkout",
            linkedUserId: userId,
            isActive: true,
          })
          .returning();
        customerId = autoCreated.id;
      }
    } else {
      throw Object.assign(new Error("Only customers can checkout cart"), { status: 403 });
    }

    let subtotal = 0;
    const orderItemsData: Array<{ bookId: number; qty: number; unitPrice: number; lineTotal: number }> = [];

    for (const item of cartItems) {
      const unitPrice = toNumber(item.book.unitPrice);
      const lineTotal = unitPrice * item.qty;

      if (item.book.stockQty < item.qty) {
        throw Object.assign(new Error(`Insufficient stock for ${item.book.title}`), { status: 400 });
      }

      orderItemsData.push({
        bookId: item.bookId,
        qty: item.qty,
        unitPrice,
        lineTotal,
      });
      subtotal += lineTotal;
    }

    const discountPct = await this.findBestDiscount(subtotal);
    const discountAmount = subtotal * discountPct / 100;
    const total = subtotal - discountAmount;

    if (me.role === "customer" && me.customerId) {
      const [cust] = await db
        .select({ creditLimit: customers.creditLimit })
        .from(customers)
        .where(eq(customers.id, customerId));

      if (cust) {
        const creditLimit = toNumber(cust.creditLimit);

        const [{ total: totalOrders }] = await db
          .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
          .from(orders)
          .where(eq(orders.customerId, customerId));

        const [{ total: totalPaid }] = await db
          .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
          .from(payments)
          .where(eq(payments.customerId, customerId));

        const outstanding = Number(totalOrders) - Number(totalPaid);
        if (outstanding + total > creditLimit) {
          throw Object.assign(
            new Error(`Order exceeds credit limit. Outstanding: ${outstanding.toFixed(2)}, New order: ${total.toFixed(2)}, Credit limit: ${creditLimit.toFixed(2)}`),
            { status: 400 },
          );
        }
      }
    }

    const orderNo = `PB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`;

    const [created] = await db
      .insert(orders)
      .values({
        orderNo,
        customerId,
        createdByUserId: userId,
        status: "confirmed",
        subtotal: String(subtotal) as any,
        discountPercentage: String(discountPct) as any,
        discount: String(discountAmount) as any,
        tax: "0" as any,
        total: String(total) as any,
        notes: notes || null,
      })
      .returning();

    for (const item of orderItemsData) {
      await db.insert(orderItems).values({
        orderId: created.id,
        bookId: item.bookId,
        qty: item.qty,
        unitPrice: String(item.unitPrice) as any,
        lineTotal: String(item.lineTotal) as any,
      });

      await db
        .update(books)
        .set({ stockQty: sql`${books.stockQty} - ${item.qty}` })
        .where(eq(books.id, item.bookId));
    }

    await this.clearCart(userId);

    const full = await this.getOrderForUser(userId, created.id);
    if (!full) {
      throw Object.assign(new Error("Order not found after creation"), { status: 500 });
    }
    return full;
  }

  async listDiscountRules(): Promise<DiscountRule[]> {
    return await db
      .select()
      .from(discountRules)
      .where(eq(discountRules.isActive, true))
      .orderBy(desc(discountRules.createdAt));
  }

  async createDiscountRule(userId: string, input: any): Promise<DiscountRule> {
    const [created] = await db
      .insert(discountRules)
      .values({
        ruleName: input.ruleName,
        discountPercentage: String(input.discountPercentage) as any,
        minOrderAmount: String(input.minOrderAmount ?? 0) as any,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validTo: input.validTo ? new Date(input.validTo) : null,
        isActive: input.isActive ?? true,
        createdByUserId: userId,
      })
      .returning();
    return created;
  }

  async deleteDiscountRule(id: number): Promise<void> {
    const [existing] = await db
      .select({ id: discountRules.id })
      .from(discountRules)
      .where(eq(discountRules.id, id));
    if (!existing) {
      throw Object.assign(new Error("Discount rule not found"), { status: 404 });
    }
    await db.delete(discountRules).where(eq(discountRules.id, id));
  }

  async findBestDiscount(subtotal: number): Promise<number> {
    const now = new Date();
    const rules = await db
      .select()
      .from(discountRules)
      .where(eq(discountRules.isActive, true));

    let bestPct = 0;
    for (const rule of rules) {
      const minAmount = toNumber(rule.minOrderAmount);
      if (subtotal < minAmount) continue;

      if (rule.validFrom && now < new Date(rule.validFrom)) continue;
      if (rule.validTo && now > new Date(rule.validTo)) continue;

      const pct = toNumber(rule.discountPercentage);
      if (pct > bestPct) {
        bestPct = pct;
      }
    }

    return bestPct;
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    profileType?: string;
    companyName?: string | null;
    taxNumber?: string | null;
    address?: string | null;
  }): Promise<CurrentUserResponse> {
    const setObj: any = { updatedAt: new Date() };
    if (data.firstName !== undefined) setObj.firstName = data.firstName;
    if (data.lastName !== undefined) setObj.lastName = data.lastName;
    if (data.phone !== undefined) setObj.phone = data.phone;
    if (data.profileType !== undefined) setObj.profileType = data.profileType;
    if (data.companyName !== undefined) setObj.companyName = data.companyName;
    if (data.taxNumber !== undefined) setObj.taxNumber = data.taxNumber;
    if (data.address !== undefined) setObj.address = data.address;

    await db.update(users).set(setObj).where(eq(users.id, userId));
    return this.getCurrentUser(userId);
  }

  async getUserWithPassword(userId: string): Promise<{ passwordHash: string | null } | null> {
    const [u] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId));
    return u ?? null;
  }

  async updatePassword(userId: string, hash: string): Promise<void> {
    await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [row] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
    return row;
  }

  async getPasswordResetToken(token: string): Promise<(PasswordResetToken & { userEmail: string | null }) | null> {
    const [row] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        token: passwordResetTokens.token,
        expiresAt: passwordResetTokens.expiresAt,
        used: passwordResetTokens.used,
        createdAt: passwordResetTokens.createdAt,
        userEmail: users.email,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.id, passwordResetTokens.userId))
      .where(eq(passwordResetTokens.token, token));
    return row || null;
  }

  async markTokenUsed(tokenId: number): Promise<void> {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, tokenId));
  }

  async listPendingPasswordResets(): Promise<Array<{ id: number; token: string; userEmail: string | null; userName: string | null; expiresAt: Date; createdAt: Date }>> {
    const rows = await db
      .select({
        id: passwordResetTokens.id,
        token: passwordResetTokens.token,
        userEmail: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        expiresAt: passwordResetTokens.expiresAt,
        createdAt: passwordResetTokens.createdAt,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.id, passwordResetTokens.userId))
      .where(and(eq(passwordResetTokens.used, false), gte(passwordResetTokens.expiresAt, new Date())))
      .orderBy(desc(passwordResetTokens.createdAt));
    return rows.map((r) => ({
      id: r.id,
      token: r.token,
      userEmail: r.userEmail,
      userName: [r.firstName, r.lastName].filter(Boolean).join(" ") || null,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    }));
  }

  private async getSchoolListWithItems(listId: number): Promise<any> {
    const [list] = await db.select().from(schoolLists).where(eq(schoolLists.id, listId));
    if (!list) throw Object.assign(new Error("School list not found"), { status: 404 });
    const items = await db
      .select({
        id: schoolListItems.id,
        listId: schoolListItems.listId,
        bookId: schoolListItems.bookId,
        qty: schoolListItems.qty,
        notes: schoolListItems.notes,
        addedAt: schoolListItems.addedAt,
        book: {
          id: books.id,
          title: books.title,
          isbn: books.isbn,
          author: books.author,
          unitPrice: books.unitPrice,
        },
      })
      .from(schoolListItems)
      .innerJoin(books, eq(schoolListItems.bookId, books.id))
      .where(eq(schoolListItems.listId, listId))
      .orderBy(schoolListItems.addedAt);
    return { ...list, items };
  }

  async listSchoolLists(userId: string): Promise<any[]> {
    const lists = await db
      .select()
      .from(schoolLists)
      .where(eq(schoolLists.userId, userId))
      .orderBy(desc(schoolLists.updatedAt));
    const result = [];
    for (const list of lists) {
      const items = await db
        .select({
          id: schoolListItems.id,
          listId: schoolListItems.listId,
          bookId: schoolListItems.bookId,
          qty: schoolListItems.qty,
          notes: schoolListItems.notes,
          addedAt: schoolListItems.addedAt,
          book: {
            id: books.id,
            title: books.title,
            isbn: books.isbn,
            author: books.author,
            unitPrice: books.unitPrice,
          },
        })
        .from(schoolListItems)
        .innerJoin(books, eq(schoolListItems.bookId, books.id))
        .where(eq(schoolListItems.listId, list.id))
        .orderBy(schoolListItems.addedAt);
      result.push({ ...list, items });
    }
    return result;
  }

  async createSchoolList(userId: string, input: { name: string; schoolName?: string | null; description?: string | null }): Promise<any> {
    const [list] = await db.insert(schoolLists).values({
      userId,
      name: input.name,
      schoolName: input.schoolName ?? null,
      description: input.description ?? null,
    }).returning();
    return { ...list, items: [] };
  }

  async updateSchoolList(userId: string, listId: number, input: { name?: string; schoolName?: string | null; description?: string | null }): Promise<any> {
    const [existing] = await db.select().from(schoolLists).where(and(eq(schoolLists.id, listId), eq(schoolLists.userId, userId)));
    if (!existing) throw Object.assign(new Error("School list not found"), { status: 404 });
    const setObj: any = { updatedAt: new Date() };
    if (input.name !== undefined) setObj.name = input.name;
    if (input.schoolName !== undefined) setObj.schoolName = input.schoolName;
    if (input.description !== undefined) setObj.description = input.description;
    await db.update(schoolLists).set(setObj).where(eq(schoolLists.id, listId));
    return this.getSchoolListWithItems(listId);
  }

  async deleteSchoolList(userId: string, listId: number): Promise<void> {
    const [existing] = await db.select().from(schoolLists).where(and(eq(schoolLists.id, listId), eq(schoolLists.userId, userId)));
    if (!existing) throw Object.assign(new Error("School list not found"), { status: 404 });
    await db.delete(schoolLists).where(eq(schoolLists.id, listId));
  }

  async addSchoolListItem(userId: string, listId: number, input: { bookId: number; qty: number; notes?: string | null }): Promise<any> {
    const [existing] = await db.select().from(schoolLists).where(and(eq(schoolLists.id, listId), eq(schoolLists.userId, userId)));
    if (!existing) throw Object.assign(new Error("School list not found"), { status: 404 });
    const [existingItem] = await db.select().from(schoolListItems).where(and(eq(schoolListItems.listId, listId), eq(schoolListItems.bookId, input.bookId)));
    if (existingItem) {
      await db.update(schoolListItems).set({ qty: existingItem.qty + input.qty }).where(eq(schoolListItems.id, existingItem.id));
    } else {
      await db.insert(schoolListItems).values({
        listId,
        bookId: input.bookId,
        qty: input.qty,
        notes: input.notes ?? null,
      });
    }
    await db.update(schoolLists).set({ updatedAt: new Date() }).where(eq(schoolLists.id, listId));
    return this.getSchoolListWithItems(listId);
  }

  async updateSchoolListItem(userId: string, listId: number, itemId: number, input: { qty?: number; notes?: string | null }): Promise<any> {
    const [existing] = await db.select().from(schoolLists).where(and(eq(schoolLists.id, listId), eq(schoolLists.userId, userId)));
    if (!existing) throw Object.assign(new Error("School list not found"), { status: 404 });
    const setObj: any = {};
    if (input.qty !== undefined) setObj.qty = input.qty;
    if (input.notes !== undefined) setObj.notes = input.notes;
    await db.update(schoolListItems).set(setObj).where(and(eq(schoolListItems.id, itemId), eq(schoolListItems.listId, listId)));
    await db.update(schoolLists).set({ updatedAt: new Date() }).where(eq(schoolLists.id, listId));
    return this.getSchoolListWithItems(listId);
  }

  async removeSchoolListItem(userId: string, listId: number, itemId: number): Promise<any> {
    const [existing] = await db.select().from(schoolLists).where(and(eq(schoolLists.id, listId), eq(schoolLists.userId, userId)));
    if (!existing) throw Object.assign(new Error("School list not found"), { status: 404 });
    await db.delete(schoolListItems).where(and(eq(schoolListItems.id, itemId), eq(schoolListItems.listId, listId)));
    await db.update(schoolLists).set({ updatedAt: new Date() }).where(eq(schoolLists.id, listId));
    return this.getSchoolListWithItems(listId);
  }

  async addSchoolListToCart(userId: string, listId: number): Promise<void> {
    const list = await this.getSchoolListWithItems(listId);
    if (list.userId !== userId) throw Object.assign(new Error("School list not found"), { status: 404 });
    if (!list.items.length) throw Object.assign(new Error("List has no items"), { status: 400 });
    for (const item of list.items) {
      const [existingCart] = await db.select().from(shoppingCart).where(and(eq(shoppingCart.userId, userId), eq(shoppingCart.bookId, item.bookId)));
      if (existingCart) {
        await db.update(shoppingCart).set({ qty: existingCart.qty + item.qty }).where(eq(shoppingCart.id, existingCart.id));
      } else {
        await db.insert(shoppingCart).values({
          userId,
          bookId: item.bookId,
          qty: item.qty,
        });
      }
    }
  }

  async seedIfEmpty(): Promise<void> {
    const [{ count: booksCount }] = await db.select({ count: sql<number>`count(*)` }).from(books);
    if (booksCount > 0) return;

    const bcrypt = await import("bcryptjs");
    const adminHash = await bcrypt.hash("admin123", 10);

    const [admin] = await db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@pyramidbooks.example",
        firstName: "Pyramid",
        lastName: "Admin",
        passwordHash: adminHash,
        profileImageUrl: null,
        role: "admin",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const [sales] = await db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000002",
        email: "sales@pyramidbooks.example",
        firstName: "Amina",
        lastName: "Saleem",
        profileImageUrl: null,
        role: "salesman",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const salesmanId = (sales?.id ?? "00000000-0000-0000-0000-000000000002") as string;
    const adminId = (admin?.id ?? "00000000-0000-0000-0000-000000000001") as string;

    const createdCustomers = await db
      .insert(customers)
      .values([
        {
          name: "Cedar Town Books", 
          customerType: "customer",
          phone: "+1 555 0134",
          email: "orders@cedartownbooks.example",
          address: "14 Cedar Avenue, Springfield",
          creditLimit: "5000",
          notes: "Preferred delivery: Tue/Thu",
          assignedSalesmanUserId: salesmanId,
          linkedUserId: adminId,
          isActive: true,
        },
        {
          name: "Riverside Community Library",
          customerType: "customer",
          phone: "+1 555 0199",
          email: "acquisitions@riversidelibrary.example",
          address: "200 Riverside Rd, Springfield",
          creditLimit: "8000",
          notes: "Invoice monthly",
          assignedSalesmanUserId: salesmanId,
          isActive: true,
        },
        {
          name: "Walk-in (Local)",
          customerType: "customer",
          phone: null,
          email: null,
          address: "Retail Counter",
          creditLimit: "0",
          notes: "Cash sales",
          assignedSalesmanUserId: salesmanId,
          isActive: true,
        },
      ])
      .returning();

    await db.insert(books).values([
      {
        isbn: "9780140449136",
        title: "The Odyssey",
        author: "Homer",
        publisher: "Penguin Classics",
        category: "Classics",
        description: "A foundational epic poem translated for modern readers.",
        unitPrice: "14.99",
        stockQty: 120,
        reorderLevel: 25,
        isActive: true,
      },
      {
        isbn: "9780062316097",
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        publisher: "Harper",
        category: "History",
        description: "A sweeping narrative of human history and culture.",
        unitPrice: "18.50",
        stockQty: 60,
        reorderLevel: 15,
        isActive: true,
      },
      {
        isbn: "9780061120084",
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        publisher: "Harper Perennial",
        category: "Fiction",
        description: "A timeless American novel of justice and compassion.",
        unitPrice: "12.75",
        stockQty: 35,
        reorderLevel: 12,
        isActive: true,
      },
      {
        isbn: "9780262033848",
        title: "Introduction to Algorithms",
        author: "Cormen, Leiserson, Rivest, Stein",
        publisher: "MIT Press",
        category: "Technology",
        description: "The classic reference on algorithms with rigorous explanations.",
        unitPrice: "89.00",
        stockQty: 10,
        reorderLevel: 8,
        isActive: true,
      },
      {
        isbn: "9780596007126",
        title: "Head First Design Patterns",
        author: "Eric Freeman",
        publisher: "O'Reilly",
        category: "Technology",
        description: "A practical, visual guide to learning design patterns.",
        unitPrice: "42.00",
        stockQty: 18,
        reorderLevel: 10,
        isActive: true,
      },
    ]);

    const [firstOrder] = await db
      .insert(orders)
      .values({
        orderNo: `PB-${new Date().getFullYear()}-000001`,
        customerId: createdCustomers[0].id,
        createdByUserId: salesmanId,
        status: "confirmed",
        subtotal: "185.00",
        discount: "10.00",
        tax: "0.00",
        total: "175.00",
        notes: "Deliver to receiving dock."
      })
      .returning();

    const bookList = await db.select({ id: books.id, unitPrice: books.unitPrice }).from(books).limit(2);
    if (bookList.length >= 2) {
      await db.insert(orderItems).values([
        {
          orderId: firstOrder.id,
          bookId: bookList[0].id,
          qty: 5,
          unitPrice: bookList[0].unitPrice,
          lineTotal: "74.95" as any,
        },
        {
          orderId: firstOrder.id,
          bookId: bookList[1].id,
          qty: 6,
          unitPrice: bookList[1].unitPrice,
          lineTotal: "111.00" as any,
        },
      ]);

      await db
        .insert(payments)
        .values({
          customerId: createdCustomers[0].id,
          orderId: firstOrder.id,
          receivedByUserId: salesmanId,
          method: "bank_transfer",
          amount: "100.00",
          referenceNo: "PB-TRX-48291",
          notes: "Partial payment received.",
        })
        .returning();
    }

  }
}

export const storage = new DatabaseStorage();
