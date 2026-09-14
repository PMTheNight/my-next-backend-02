# Password Change Assignment — Backend

This Next.js API is the backend submission for the Password Change assignment.

## Implemented

- JWT authentication stored in an HTTP-only cookie, with /api/me for frontend session restoration.
- proxy.js protects every /api/item and /api/user request and forwards the verified identity in x-user request headers.
- Item handlers independently verify JWT and write list, create, update, and delete activity to the audit_log collection.
- User management and PUT /api/user/:user_id/password are Admin-only; passwords are bcrypt-hashed before storage.
- Credentialed CORS is restricted to the configured CORS_ORIGIN.

## Required environment variables

MONGODB_URI, DB_NAME, ADMIN_USER, ADMIN_PASS, JWT_SECRET, and CORS_ORIGIN.

## Submission checklist

- [x] Backend source: https://github.com/PMTheNight/my-next-backend-02
- [x] Frontend source: https://github.com/PMTheNight/my-react-frontend-01
- [x] Deployed frontend: https://my-react-frontend-01-bice.vercel.app/login
- [x] Deployed backend: https://my-next-backend-02-seven.vercel.app/
- [x] Live no-session check: the backend home shows GET /api/item → 401.
- [ ] Complete live login and audit-log evidence after the private MongoDB/admin environment variables are entered in Vercel.
