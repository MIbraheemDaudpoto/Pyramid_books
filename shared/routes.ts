import { z } from "zod";
import {
  insertBookSchema,
  insertCustomerSchema,
  roles,
  type Book,
  type CartResponse,
  type Customer,
  type CurrentUserResponse,
  type DashboardResponse,
  type DiscountRule,
  type OrderWithItemsResponse,
  type OrdersListResponse,
  type PaymentsListResponse,
  type StockReceiptsListResponse,
  type ReportResponse,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const roleSchema = z.enum(roles);

export const api = {
  auth: {
    me: {
      method: "GET" as const,
      path: "/api/me",
      responses: {
        200: z.custom<CurrentUserResponse>(),
      },
    },
  },

  dashboard: {
    get: {
      method: "GET" as const,
      path: "/api/dashboard",
      responses: {
        200: z.custom<DashboardResponse>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  users: {
    list: {
      method: "GET" as const,
      path: "/api/users",
      responses: {
        200: z.array(
          z.object({
            id: z.string(),
            email: z.string().nullable(),
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
            profileImageUrl: z.string().nullable(),
            role: roleSchema,
            isActive: z.boolean(),
            customerId: z.number().nullable().optional(),
          }),
        ),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },

    update: {
      method: "PATCH" as const,
      path: "/api/users/:id",
      input: z
        .object({
          role: roleSchema.optional(),
          isActive: z.boolean().optional(),
          customerId: z.number().nullable().optional(),
        })
        .strict(),
      responses: {
        200: z.object({
          id: z.string(),
          role: roleSchema,
          isActive: z.boolean(),
          customerId: z.number().nullable().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },

  customers: {
    list: {
      method: "GET" as const,
      path: "/api/customers",
      responses: {
        200: z.array(z.custom<Customer>()),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/customers",
      input: insertCustomerSchema,
      responses: {
        201: z.custom<Customer>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },

    update: {
      method: "PATCH" as const,
      path: "/api/customers/:id",
      input: insertCustomerSchema.partial(),
      responses: {
        200: z.custom<Customer>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },

    delete: {
      method: "DELETE" as const,
      path: "/api/customers/:id",
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },

  books: {
    list: {
      method: "GET" as const,
      path: "/api/books",
      input: z
        .object({
          q: z.string().optional(),
          category: z.string().optional(),
          lowStock: z.union([z.literal("true"), z.literal("false")]).optional(),
        })
        .optional(),
      responses: {
        200: z.array(z.custom<Book>()),
        401: errorSchemas.unauthorized,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/books",
      input: insertBookSchema,
      responses: {
        201: z.custom<Book>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },

    update: {
      method: "PATCH" as const,
      path: "/api/books/:id",
      input: insertBookSchema.partial(),
      responses: {
        200: z.custom<Book>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },

    delete: {
      method: "DELETE" as const,
      path: "/api/books/:id",
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },

  orders: {
    list: {
      method: "GET" as const,
      path: "/api/orders",
      responses: {
        200: z.custom<OrdersListResponse>(),
        401: errorSchemas.unauthorized,
      },
    },

    get: {
      method: "GET" as const,
      path: "/api/orders/:id",
      responses: {
        200: z.custom<OrderWithItemsResponse>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/orders",
      input: z
        .object({
          customerId: z.coerce.number(),
          items: z
            .array(
              z.object({
                bookId: z.coerce.number(),
                qty: z.coerce.number().int().positive(),
                unitPrice: z.coerce.number().nonnegative(),
                lineTotal: z.coerce.number().nonnegative(),
              }),
            )
            .min(1),
          discountPercentage: z.coerce.number().min(0).max(100).optional(),
          discount: z.coerce.number().nonnegative().optional(),
          tax: z.coerce.number().nonnegative().optional(),
          notes: z.string().optional(),
        })
        .strict(),
      responses: {
        201: z.custom<OrderWithItemsResponse>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },

    updateStatus: {
      method: "PATCH" as const,
      path: "/api/orders/:id/status",
      input: z
        .object({
          status: z
            .enum(["draft", "confirmed", "shipped", "delivered", "cancelled"])
            .or(z.string()),
        })
        .strict(),
      responses: {
        200: z.custom<OrderWithItemsResponse>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },

  payments: {
    list: {
      method: "GET" as const,
      path: "/api/payments",
      responses: {
        200: z.custom<PaymentsListResponse>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/payments",
      input: z
        .object({
          customerId: z.coerce.number(),
          orderId: z.coerce.number().nullable().optional(),
          amount: z.coerce.number().positive(),
          method: z.string().min(1),
          referenceNo: z.string().optional(),
          notes: z.string().optional(),
        })
        .strict(),
      responses: {
        201: z.object({ id: z.number() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
  },
  stockReceipts: {
    list: {
      method: "GET" as const,
      path: "/api/stock-receipts",
      responses: {
        200: z.custom<StockReceiptsListResponse>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/stock-receipts",
      input: z.object({
        publisher: z.string().min(1),
        items: z.array(z.object({
          bookId: z.coerce.number(),
          qty: z.coerce.number().int().positive(),
        })).min(1),
        notes: z.string().optional(),
      }).strict(),
      responses: {
        201: z.custom<StockReceiptsListResponse[number]>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
  },

  csv: {
    exportBooks: {
      method: "GET" as const,
      path: "/api/csv/books",
    },
    importBooks: {
      method: "POST" as const,
      path: "/api/csv/books",
    },
    exportCustomers: {
      method: "GET" as const,
      path: "/api/csv/customers",
    },
    importCustomers: {
      method: "POST" as const,
      path: "/api/csv/customers",
    },
    exportStock: {
      method: "GET" as const,
      path: "/api/csv/stock-receipts",
    },
    templateBooks: {
      method: "GET" as const,
      path: "/api/csv/template/books",
    },
    templateCustomers: {
      method: "GET" as const,
      path: "/api/csv/template/customers",
    },
  },

  reports: {
    get: {
      method: "GET" as const,
      path: "/api/reports",
      input: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional(),
      responses: {
        200: z.custom<ReportResponse>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  cart: {
    list: {
      method: "GET" as const,
      path: "/api/cart",
      responses: {
        200: z.custom<CartResponse>(),
        401: errorSchemas.unauthorized,
      },
    },
    add: {
      method: "POST" as const,
      path: "/api/cart",
      input: z.object({
        bookId: z.coerce.number(),
        qty: z.coerce.number().int().positive().default(1),
      }).strict(),
      responses: {
        201: z.custom<CartResponse>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/cart/:id",
      input: z.object({
        qty: z.coerce.number().int().positive(),
      }).strict(),
      responses: {
        200: z.custom<CartResponse>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    remove: {
      method: "DELETE" as const,
      path: "/api/cart/:id",
      responses: {
        200: z.custom<CartResponse>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    checkout: {
      method: "POST" as const,
      path: "/api/cart/checkout",
      input: z.object({
        notes: z.string().optional(),
      }).optional(),
      responses: {
        201: z.custom<OrderWithItemsResponse>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },

  discountRules: {
    list: {
      method: "GET" as const,
      path: "/api/discount-rules",
      responses: {
        200: z.array(z.custom<DiscountRule>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/discount-rules",
      input: z.object({
        ruleName: z.string().min(1),
        discountPercentage: z.coerce.number().min(0).max(100),
        minOrderAmount: z.coerce.number().nonnegative().default(0),
        validFrom: z.string().optional(),
        validTo: z.string().optional(),
        isActive: z.boolean().default(true),
      }).strict(),
      responses: {
        201: z.custom<DiscountRule>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/discount-rules/:id",
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
  },
} as const;

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CurrentUserApiResponse = z.infer<typeof api.auth.me.responses[200]>;
export type DashboardApiResponse = z.infer<typeof api.dashboard.get.responses[200]>;
