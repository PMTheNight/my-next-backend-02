import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import corsHeaders from "@/lib/cors";
import { isAdmin } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/utils";
import { getClientPromise } from "@/lib/mongodb";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function users() {
  const client = await getClientPromise();
  return client.db(process.env.DB_NAME).collection("user");
}

export async function GET(request) {
  if (!isAdmin(request)) return errorResponse("Unauthorized Request", 403);
  try {
    const list = await (await users()).find({}, { projection: { password: 0 } }).sort({ username: 1 }).toArray();
    return successResponse({ users: list.map((user) => ({ ...user, _id: user._id.toString() })) });
  } catch (error) {
    console.error("List users error:", error);
    return errorResponse("Unable to load users", 500);
  }
}

export async function POST(request) {
  if (!isAdmin(request)) return errorResponse("Unauthorized Request", 403);
  try {
    const { username, email, password, firstname, lastname } = await request.json();
    if (!username || !email || !password) return errorResponse("Missing mandatory data", 400);
    if (password.length < 6) return errorResponse("Password must be at least 6 characters", 400);
    const result = await (await users()).insertOne({
      username,
      email,
      firstname: firstname || "",
      lastname: lastname || "",
      password: await bcrypt.hash(password, 12),
      status: "ACTIVE",
      createdAt: new Date(),
    });
    return successResponse({ id: result.insertedId.toString(), message: "User created" }, 201);
  } catch (error) {
    console.error("Create user error:", error);
    return errorResponse("Unable to create user", 400);
  }
}

export async function PATCH(request) {
  if (!isAdmin(request)) return errorResponse("Unauthorized Request", 403);
  try {
    const { id, password } = await request.json();
    if (!ObjectId.isValid(id) || typeof password !== "string" || password.length < 6) {
      return errorResponse("Invalid user or password", 400);
    }
    const result = await (await users()).updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: await bcrypt.hash(password, 12), updatedAt: new Date() } },
    );
    return result.matchedCount ? successResponse({ message: "Password updated" }) : errorResponse("User not found", 404);
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse("Unable to update user", 500);
  }
}
