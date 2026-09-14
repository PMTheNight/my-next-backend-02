import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyJWT(request) {
  try {
    const token = request.cookies.get("token")?.value;
    return token && JWT_SECRET ? jwt.verify(token, JWT_SECRET) : null;
  } catch {
    return null;
  }
}

export function isAdmin(request) {
  return request.headers.get("x-user-id") === "-1";
}

