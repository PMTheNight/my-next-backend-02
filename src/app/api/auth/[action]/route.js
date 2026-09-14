import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse } from "@/lib/utils";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request, { params }) {
  const { action } = await params;
  if (action !== "login") return errorResponse("Not found", 404);
  try {
    const { email, password } = await request.json();
    if (!email || !password) return errorResponse("Missing email or password", 400);

    let user = null;
    if (email === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
      user = { id: "-1", email, username: "admin" };
    } else {
      const client = await getClientPromise();
      const record = await client.db(process.env.DB_NAME).collection("user").findOne({ email });
      if (record && await bcrypt.compare(password, record.password)) {
        user = { id: record._id.toString(), email: record.email, username: record.username };
      }
    }

    if (!user) return errorResponse("Invalid email or password", 401);
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
    const response = NextResponse.json({ message: "Login successful", user }, { status: 200, headers: corsHeaders });
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Unable to log in", 500);
  }
}

export async function GET(request, { params }) {
  const { action } = await params;
  if (action !== "logout") return errorResponse("Not found", 404);
  const response = NextResponse.json({ message: "Logout successful" }, { status: 200, headers: corsHeaders });
  response.cookies.set("token", "", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
