import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";
import { verifyJWT } from "@/lib/auth";
import { errorResponse } from "@/lib/utils";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET(request) {
  const user = verifyJWT(request);
  return user
    ? NextResponse.json(user, { status: 200, headers: corsHeaders })
    : errorResponse("Unauthorized Request", 401);
}
