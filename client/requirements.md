## Packages
bootstrap | Bootstrap CSS/JS for dashboard layout, offcanvas sidebar, tables, forms
@popperjs/core | Required by Bootstrap JS (dropdowns, tooltips, popovers)

## Notes
Bootstrap JS is loaded via ESM in client/src/main.tsx and requires @popperjs/core.
Auth: use /api/login and /api/logout redirects; current user via GET /api/me (CurrentUserResponse|null).
RBAC enforced by UI gating; backend should also enforce permissions.
All API URLs must come from @shared/routes (api.*.path) and be validated with Zod schemas from @shared/routes.
