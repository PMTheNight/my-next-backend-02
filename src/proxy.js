import { NextResponse } from "next/server";
import { verifyJWT } from "./lib/auth";
import corsHeaders from "./lib/cors";

export function proxy(request) {
  if (request.method === "OPTIONS") return NextResponse.next();

  const user = verifyJWT(request);
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized Request" },
      { status: 401, headers: corsHeaders },
    );
  }

  const headers = new Headers(request.headers);
  headers.set("x-user-id", String(user.id));
  headers.set("x-user-email", String(user.email));
  headers.set("x-user-username", String(user.username));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/item/:path*", "/api/user/:path*"],
};
