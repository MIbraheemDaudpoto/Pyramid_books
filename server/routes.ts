import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { api } from "@shared/routes";
import { storage } from "./storage";
import { isAuthenticated, registerAuthRoutes, setupAuth } from "./replit_integrations/auth";

function getUserId(req: any): string {
  const id = req.user?.claims?.sub;
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

  // Users (super_admin only enforced in storage/routes by role in frontend; backend should protect)
  app.get(api.users.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me || me.role !== "super_admin") {
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
      if (!me || me.role !== "super_admin") {
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

  // Customers
  app.get(api.customers.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role === "local_customer") return res.status(403).json({ message: "Forbidden" });

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
      if (!me || me.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const input = api.customers.create.input.parse(req.body);
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
      if (!me || me.role !== "super_admin") {
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
      if (!me || me.role !== "super_admin") {
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
      const params = api.books.list.input?.parse(req.query);
      const list = await storage.listBooks({
        q: params?.q,
        category: params?.category,
        lowStock: params?.lowStock === "true",
      });
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
      if (!me || me.role !== "super_admin") {
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
      if (!me || me.role !== "super_admin") {
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
      if (!me || me.role !== "super_admin") {
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
      const created = await storage.createOrder(userId, input);
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

  // Payments
  app.get(api.payments.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const me = await storage.getCurrentUser(userId);
      if (!me) return res.status(401).json({ message: "Unauthorized" });
      if (me.role === "local_customer") return res.status(403).json({ message: "Forbidden" });

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

  // Seed once on boot (safe to call repeatedly)
  await storage.seedIfEmpty();

  return httpServer;
}
