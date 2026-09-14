import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { isAdmin } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/utils";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function PUT(request, { params }) {
  if (!isAdmin(request)) return errorResponse("Unauthorized Request", 403);
  const { user_id } = await params;
  const { password } = await request.json();
  if (typeof password !== "string" || password.length < 6) {
    return errorResponse("Password must be at least 6 characters", 400);
  }
  if (!ObjectId.isValid(user_id)) return errorResponse("Invalid user id", 400);
  try {
    const client = await getClientPromise();
    const result = await client.db(process.env.DB_NAME).collection("user").updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { password: await bcrypt.hash(password, 12), updatedAt: new Date() } },
    );
    if (!result.matchedCount) return errorResponse("User not found", 404);
    return successResponse({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Unable to change password", 500);
  }
}
