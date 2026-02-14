import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import { z } from "zod";
import { api } from "@shared/routes";
import { storage } from "./storage";
import { isAuthenticated, registerAuthRoutes, setupAuth } from "./replit_integrations/auth";
import { sendNewOrderNotification } from "./email";

const textParser = express.text({ type: ["text/csv", "text/plain", "application/csv"], limit: "10mb" });

function getUserId(req: any): string {
  const id = req.userId || req.session?.userId;
  if (!id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return String(id);
}

function asStatus(err: any): number {
  return err?.status || err?.statusCode || 500;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // Current user info for app
  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const me = await storage.getCurrentUser(userId);
    res.json(me);
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profileSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
        profileType: z.enum(["individual", "school", "company"]).optional(),
        companyName: z.string().optional().nullable(),
        taxNumber: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
      });
      const input = profileSchema.parse(req.body);
      const updated = await storage.updateProfile(userId, input);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch("/api/profile/password", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      });
      const input = schema.parse(req.body);

      const bcrypt = await import("bcryptjs");
      const user = await storage.getUserWithPassword(userId);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Cannot change password" });
      }
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const hash = await bcrypt.hash(input.newPassword, 10);
      await storage.updatePassword(userId, hash);
      res.json({ message: "Password updated" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.get(api.dashboard.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = await storage.getDashboard(userId);
      res.json(data);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Users (admin only)
  app.get(api.users.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const list = await storage.listUsers();
      res.json(list);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch(api.users.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.users.update.input.parse(req.body);
      const updated = await storage.updateUser(String(req.params.id), {
        role: input.role,
        isActive: input.isActive,
        customerId: input.customerId,
      });

      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const schema = z.object({
        email: z.string().email("Valid email required"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["admin", "salesman", "customer"]),
      });
      const input = schema.parse(req.body);
      const existing = await storage.findUserByEmail(input.email);
      if (existing) {
        return res.status(409).json({ message: "A user with this email already exists" });
      }
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash(input.password, 10);
      const { randomUUID } = await import("crypto");
      const newUser = await storage.upsertUser({
        id: randomUUID(),
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: hash,
        role: input.role as any,
      });
      res.status(201).json(newUser);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.get("/api/admin/password-resets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const resets = await storage.listPendingPasswordResets();
      res.json(resets);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Customers
  app.get(api.customers.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role === "customer") return res.status(403).json({ message: "Forbidden" });

      const list = await storage.listCustomersForUser(userId);
      res.json(list);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.customers.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.customers.create.input.parse(req.body);
      if (me.role === "salesman" && !input.assignedSalesmanUserId) {
        input.assignedSalesmanUserId = userId;
      }
      const created = await storage.createCustomer(input);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch(api.customers.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.customers.update.input.parse(req.body);
      const updated = await storage.updateCustomer(Number(req.params.id), input);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.delete(api.customers.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteCustomer(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Books
  app.get(api.books.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      const params = api.books.list.input?.parse(req.query);
      const list = await storage.listBooks({
        q: params?.q,
        category: params?.category,
        lowStock: params?.lowStock === "true",
      });
      if (me?.role === "customer") {
        const stripped = list.map(({ stockQty, buyingPrice, reorderLevel, ...book }) => ({
          ...book,
          stockQty: stockQty > 0 ? 1 : 0,
          buyingPrice: "0",
          reorderLevel: 0,
        }));
        return res.json(stripped);
      }
      res.json(list);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.books.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.books.create.input.parse(req.body);
      const created = await storage.createBook(input);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch(api.books.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.books.update.input.parse(req.body);
      const updated = await storage.updateBook(Number(req.params.id), input);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.delete(api.books.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteBook(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Orders
  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const list = await storage.listOrdersForUser(userId);
      res.json(list);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.get(api.orders.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const order = await storage.getOrderForUser(userId, Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.orders.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.orders.create.input.parse(req.body);
      const created = await storage.createOrder(userId, {
        ...input,
        items: input.items.map((item: any) => ({
          ...item,
          unitPrice: String(item.unitPrice)
        }))
      } as any);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch(api.orders.updateStatus.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.orders.updateStatus.input.parse(req.body);
      const updated = await storage.updateOrderStatus(userId, Number(req.params.id), input);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch("/api/orders/:orderId/items/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orderId = Number(req.params.orderId);
      const itemId = Number(req.params.itemId);
      const { qty } = z.object({ qty: z.number().int().positive() }).parse(req.body);
      const updated = await storage.updateOrderItem(userId, orderId, itemId, qty);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  app.delete("/api/orders/:orderId/items/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orderId = Number(req.params.orderId);
      const itemId = Number(req.params.itemId);
      const updated = await storage.deleteOrderItem(userId, orderId, itemId);
      res.json(updated);
    } catch (err: any) {
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  // Payments
  app.get(api.payments.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });

      const list = await storage.listPaymentsForUser(userId);
      res.json(list);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.payments.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.payments.create.input.parse(req.body);
      const id = await storage.createPayment(userId, input);
      res.status(201).json({ id });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Stock Receipts
  app.get(api.stockReceipts.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role !== "admin" && me.role !== "salesman") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const list = await storage.listStockReceipts();
      res.json(list);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.stockReceipts.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role !== "admin" && me.role !== "salesman") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.stockReceipts.create.input.parse(req.body);
      const created = await storage.createStockReceipt(userId, input);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // CSV Export/Import
  app.get(api.csv.templateBooks.path, isAuthenticated, async (_req: any, res) => {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=books_template.csv");
    res.send("isbn,title,author,publisher,category,description,unitPrice,stockQty,reorderLevel\n");
  });

  app.get(api.csv.templateCustomers.path, isAuthenticated, async (_req: any, res) => {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=customers_template.csv");
    res.send("name,customerType,phone,email,address,creditLimit,notes\n");
  });

  app.get(api.csv.templateStock.path, isAuthenticated, async (_req: any, res) => {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=stock_receipts_template.csv");
    res.send("publisher,bookTitle,qty,buyingPrice,companyDiscount,notes\n");
  });

  app.get(api.csv.exportBooks.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const booksList = await storage.listBooks();
      const headers = ["id", "isbn", "title", "author", "publisher", "category", "description", "unitPrice", "stockQty", "reorderLevel", "isActive"];
      const rows = booksList.map((b) =>
        headers.map((h) => csvEscape(String((b as any)[h] ?? ""))).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=books.csv");
      res.send(csv);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.csv.importBooks.path, textParser, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const csvText = typeof req.body === "string" ? req.body : req.body?.csv;
      if (!csvText || typeof csvText !== "string") {
        return res.status(400).json({ message: "CSV data required in 'csv' field" });
      }

      const rows = parseCsv(csvText);
      if (rows.length < 2) {
        return res.status(400).json({ message: "CSV must have a header row and at least one data row" });
      }

      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const results: { created: number; updated: number; errors: string[] } = { created: 0, updated: 0, errors: [] };

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (row.length === 1 && row[0].trim() === "")) continue;
        try {
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = row[idx]?.trim() ?? "";
          });

          const bookData: any = {
            title: obj.title || "",
            isbn: obj.isbn || null,
            author: obj.author || null,
            publisher: obj.publisher || null,
            category: obj.category || null,
            description: obj.description || null,
            unitPrice: obj.unitprice || obj.unitPrice || "0",
            stockQty: parseInt(obj.stockqty || obj.stockQty || "0") || 0,
            reorderLevel: parseInt(obj.reorderlevel || obj.reorderLevel || "10") || 10,
            isActive: obj.isactive !== "false" && obj.isActive !== "false",
          };

          if (!bookData.title) {
            results.errors.push(`Row ${i + 1}: title is required`);
            continue;
          }

          if (obj.id && obj.id !== "") {
            await storage.updateBook(parseInt(obj.id), bookData);
            results.updated++;
          } else {
            await storage.createBook(bookData);
            results.created++;
          }
        } catch (e: any) {
          results.errors.push(`Row ${i + 1}: ${e.message}`);
        }
      }

      res.json(results);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.get(api.csv.exportCustomers.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const customersList = await storage.listCustomersForUser(userId);
      const headers = ["id", "name", "customerType", "phone", "email", "address", "creditLimit", "notes", "assignedSalesmanUserId", "isActive"];
      const rows = customersList.map((c) =>
        headers.map((h) => csvEscape(String((c as any)[h] ?? ""))).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
      res.send(csv);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.csv.importCustomers.path, textParser, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const csvText = typeof req.body === "string" ? req.body : req.body?.csv;
      if (!csvText || typeof csvText !== "string") {
        return res.status(400).json({ message: "CSV data required in 'csv' field" });
      }

      const rows = parseCsv(csvText);
      if (rows.length < 2) {
        return res.status(400).json({ message: "CSV must have a header row and at least one data row" });
      }

      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const results: { created: number; updated: number; errors: string[] } = { created: 0, updated: 0, errors: [] };

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (row.length === 1 && row[0].trim() === "")) continue;
        try {
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = row[idx]?.trim() ?? "";
          });

          const custData: any = {
            name: obj.name || "",
            customerType: obj.customertype || obj.customerType || "customer",
            phone: obj.phone || null,
            email: obj.email || null,
            address: obj.address || null,
            creditLimit: obj.creditlimit || obj.creditLimit || "0",
            notes: obj.notes || null,
            assignedSalesmanUserId: obj.assignedsalesmanuserid || obj.assignedSalesmanUserId || null,
            isActive: obj.isactive !== "false" && obj.isActive !== "false",
          };

          if (!custData.name) {
            results.errors.push(`Row ${i + 1}: name is required`);
            continue;
          }

          if (obj.id && obj.id !== "") {
            await storage.updateCustomer(parseInt(obj.id), custData);
            results.updated++;
          } else {
            await storage.createCustomer(custData);
            results.created++;
          }
        } catch (e: any) {
          results.errors.push(`Row ${i + 1}: ${e.message}`);
        }
      }

      res.json(results);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.get(api.csv.exportStock.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role !== "admin" && me.role !== "salesman") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const receipts = await storage.listStockReceipts();
      const headers = ["receiptNo", "publisher", "receivedByName", "receivedAt", "bookTitle", "qty", "buyingPrice", "companyDiscount", "notes"];
      const rows: string[] = [];
      for (const r of receipts) {
        for (const item of r.items) {
          rows.push(
            [
              csvEscape(r.receiptNo),
              csvEscape(r.publisher),
              csvEscape(r.receivedByName),
              csvEscape(r.receivedAt ? new Date(r.receivedAt).toISOString() : ""),
              csvEscape(item.bookTitle),
              String(item.qty),
              String(item.buyingPrice ?? "0"),
              String(item.companyDiscount ?? "0"),
              csvEscape(r.notes ?? ""),
            ].join(",")
          );
        }
      }
      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=stock-receipts.csv");
      res.send(csv);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.csv.importStock.path, textParser, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || (me.role !== "admin" && me.role !== "salesman")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const csvText = typeof req.body === "string" ? req.body : req.body?.csv;
      if (!csvText || typeof csvText !== "string") {
        return res.status(400).json({ message: "CSV data required" });
      }

      const rows = parseCsv(csvText);
      if (rows.length < 2) {
        return res.status(400).json({ message: "CSV must have a header row and at least one data row" });
      }

      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const grouped: Record<string, { items: Array<{ bookTitle: string; qty: number; buyingPrice: string; companyDiscount: string }>; notes: string }> = {};

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (row.length === 1 && row[0].trim() === "")) continue;
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx]?.trim() ?? "";
        });

        const publisher = obj.publisher || "Unknown";
        const bookTitle = obj.booktitle || obj.book_title || obj.title || "";
        const qty = parseInt(obj.qty || obj.quantity || "1", 10) || 1;
        const buyingPrice = obj.buyingprice || obj.buying_price || "0";
        const companyDiscount = obj.companydiscount || obj.company_discount || "0";
        const notes = obj.notes || "";

        if (!bookTitle) continue;

        if (!grouped[publisher]) {
          grouped[publisher] = { items: [], notes: "" };
        }
        if (notes && !grouped[publisher].notes.includes(notes)) {
          grouped[publisher].notes = grouped[publisher].notes
            ? `${grouped[publisher].notes}; ${notes}`
            : notes;
        }
        grouped[publisher].items.push({ bookTitle, qty, buyingPrice, companyDiscount });
      }

      let totalReceipts = 0;
      let totalItems = 0;
      const errors: string[] = [];

      const allBooks = await storage.listBooks();

      for (const [publisher, data] of Object.entries(grouped)) {
        const receiptItems: Array<{ bookId: number; qty: number }> = [];

        for (const item of data.items) {
          const match = allBooks.find(
            (b) => b.title.toLowerCase() === item.bookTitle.toLowerCase()
          );
          if (!match) {
            errors.push(`Book not found: "${item.bookTitle}"`);
            continue;
          }
          receiptItems.push({
            bookId: match.id,
            qty: item.qty,
            buyingPrice: String(item.buyingPrice),
            companyDiscount: String(item.companyDiscount || 0),
          } as any);
          totalItems++;
        }

        if (receiptItems.length > 0) {
          await storage.createStockReceipt(userId, {
            publisher,
            items: receiptItems,
            notes: data.notes || undefined,
          });
          totalReceipts++;
        }
      }

      res.json({
        count: totalItems,
        receipts: totalReceipts,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Reports
  app.get(api.reports.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role !== "admin" && me.role !== "salesman") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const params = api.reports.get.input?.parse(req.query);
      const data = await storage.getReports(params?.from, params?.to);
      res.json(data);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Analytics
  app.get(api.analytics.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role !== "admin" && me.role !== "salesman") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const params = api.analytics.get.input?.parse(req.query);
      const data = await storage.getAnalytics(params?.period || "monthly", userId);
      res.json(data);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Cart
  app.get(api.cart.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const items = await storage.listCartItems(userId);
      res.json(items);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.cart.add.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.cart.add.input.parse(req.body);
      const items = await storage.addToCart(userId, input.bookId, input.qty);
      res.status(201).json(items);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch(api.cart.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.cart.update.input.parse(req.body);
      const items = await storage.updateCartItem(userId, Number(req.params.id), input.qty);
      res.json(items);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.delete(api.cart.remove.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const items = await storage.removeCartItem(userId, Number(req.params.id));
      res.json(items);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.cart.checkout.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.cart.checkout.input?.parse(req.body ?? {});
      const order = await storage.checkoutCart(userId, input?.notes);
      res.status(201).json(order);

      try {
        const recipientEmails = await storage.getOrderNotificationRecipients(order.customer.id);
        if (recipientEmails.length > 0) {
          const notifData = {
            orderNo: order.orderNo,
            customerName: order.customer.name,
            total: Number(order.total).toFixed(2),
            itemCount: order.items.length,
            items: order.items.map((it: any) => ({
              title: it.book.title,
              qty: it.qty,
              unitPrice: Number(it.unitPrice).toFixed(2),
              lineTotal: Number(it.lineTotal).toFixed(2),
            })),
          };
          sendNewOrderNotification(recipientEmails, notifData).catch(() => { });
        }
      } catch (_notifErr) { }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Discount Rules
  app.get(api.discountRules.list.path, isAuthenticated, async (_req: any, res) => {
    try {
      const rules = await storage.listDiscountRules();
      res.json(rules);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post(api.discountRules.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.discountRules.create.input.parse(req.body);
      const created = await storage.createDiscountRule(userId, input);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.delete(api.discountRules.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteDiscountRule(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // School Lists API
  app.get("/api/school-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const lists = await storage.listSchoolLists(userId);
      res.json(lists);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post("/api/school-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        name: z.string().min(1, "List name is required"),
        schoolName: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      });
      const input = schema.parse(req.body);
      const list = await storage.createSchoolList(userId, input);
      res.status(201).json(list);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch("/api/school-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        name: z.string().min(1).optional(),
        schoolName: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      });
      const input = schema.parse(req.body);
      const list = await storage.updateSchoolList(userId, Number(req.params.id), input);
      res.json(list);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.delete("/api/school-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.deleteSchoolList(userId, Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post("/api/school-lists/:id/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        bookId: z.coerce.number(),
        qty: z.coerce.number().int().positive().default(1),
        notes: z.string().optional().nullable(),
      });
      const input = schema.parse(req.body);
      const list = await storage.addSchoolListItem(userId, Number(req.params.id), input);
      res.status(201).json(list);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.patch("/api/school-lists/:listId/items/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        qty: z.coerce.number().int().positive().optional(),
        notes: z.string().optional().nullable(),
      });
      const input = schema.parse(req.body);
      const list = await storage.updateSchoolListItem(userId, Number(req.params.listId), Number(req.params.itemId), input);
      res.json(list);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.delete("/api/school-lists/:listId/items/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const list = await storage.removeSchoolListItem(userId, Number(req.params.listId), Number(req.params.itemId));
      res.json(list);
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  app.post("/api/school-lists/:id/add-to-cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.addSchoolListToCart(userId, Number(req.params.id));
      res.json({ message: "Items added to cart" });
    } catch (err: any) {
      const status = asStatus(err);
      res.status(status).json({ message: err.message || "Error" });
    }
  });

  // Chat/Messaging
  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const conversations = await storage.listConversations(userId);
      res.json(conversations);
    } catch (err: any) {
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  app.get("/api/messages/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const list = await storage.listChatUsers(userId);
      res.json(list);
    } catch (err: any) {
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  app.get("/api/messages/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const count = await storage.getUnreadCount(userId);
      res.json({ count });
    } catch (err: any) {
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  app.post("/api/messages/:otherUserId/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.markAsRead(userId, req.params.otherUserId);
      res.status(204).end();
    } catch (err: any) {
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  app.get("/api/messages/:otherUserId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const messages = await storage.listMessages(userId, req.params.otherUserId);
      res.json(messages);
    } catch (err: any) {
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const schema = z.object({
        receiverId: z.string().min(1),
        content: z.string().min(1),
      });
      const { receiverId, content } = schema.parse(req.body);
      const msg = await storage.sendMessage(userId, receiverId, content);
      res.status(201).json(msg);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(asStatus(err)).json({ message: err.message || "Error" });
    }
  });

  // Seed once on boot (safe to call repeatedly)
  await storage.seedIfEmpty();

  return httpServer;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.trim() === "") continue;
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    rows.push(fields);
  }

  return rows;
}
