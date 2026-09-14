import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import corsHeaders from "@/lib/cors";
import { verifyJWT } from "@/lib/auth";
import { errorResponse } from "@/lib/utils";
import { getClientPromise } from "@/lib/mongodb";
import { writeItemAudit } from "@/lib/audit";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function collection() {
  const client = await getClientPromise();
  return client.db(process.env.DB_NAME).collection("item");
}

function validate(input) {
  if (!input.name?.trim()) return "Item name is required";
  if (!Number.isFinite(Number(input.quantity)) || Number(input.quantity) < 0) return "Quantity must be a non-negative number";
  if (!Number.isFinite(Number(input.price)) || Number(input.price) < 0) return "Price must be a non-negative number";
  return null;
}

function serialize(item) {
  return { ...item, _id: item._id.toString() };
}

async function idFrom(params) {
  const { segments = [] } = await params;
  return segments.length === 1 && ObjectId.isValid(segments[0]) ? new ObjectId(segments[0]) : null;
}

export async function GET(request, { params }) {
  const user = verifyJWT(request);
  if (!user) return errorResponse("Unauthorized Request", 401);
  const { segments = [] } = await params;
  if (segments.length) return errorResponse("Item not found", 404);
  try {
    const items = await (await collection()).find({ status: { $ne: "DELETED" } }).sort({ createdAt: -1, _id: -1 }).toArray();
    const data = items.map(serialize);
    await writeItemAudit({ action: "ITEM_LIST", user, details: { itemCount: data.length } });
    return NextResponse.json({ items: data }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("List items error:", error);
    return errorResponse("Unable to load items", 500);
  }
}

export async function POST(request, { params }) {
  const user = verifyJWT(request);
  if (!user) return errorResponse("Unauthorized Request", 401);
  const { segments = [] } = await params;
  if (segments.length) return errorResponse("Not found", 404);
  try {
    const input = await request.json();
    const message = validate(input);
    if (message) return errorResponse(message, 400);
    const now = new Date();
    const item = { name: input.name.trim(), description: input.description?.trim() || "", quantity: Number(input.quantity), price: Number(input.price), status: "ACTIVE", createdAt: now, updatedAt: now, createdBy: user.id };
    const result = await (await collection()).insertOne(item);
    await writeItemAudit({ action: "ITEM_CREATE", user, itemId: result.insertedId, details: { name: item.name } });
    return NextResponse.json({ message: "Item created", item: serialize({ ...item, _id: result.insertedId }) }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Create item error:", error);
    return errorResponse("Unable to create item", 500);
  }
}

export async function PUT(request, { params }) {
  const user = verifyJWT(request);
  if (!user) return errorResponse("Unauthorized Request", 401);
  const id = await idFrom(params);
  if (!id) return errorResponse("Invalid item id", 400);
  try {
    const input = await request.json();
    const message = validate(input);
    if (message) return errorResponse(message, 400);
    const item = await (await collection()).findOneAndUpdate(
      { _id: id, status: { $ne: "DELETED" } },
      { $set: { name: input.name.trim(), description: input.description?.trim() || "", quantity: Number(input.quantity), price: Number(input.price), updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!item) return errorResponse("Item not found", 404);
    await writeItemAudit({ action: "ITEM_UPDATE", user, itemId: item._id, details: { name: item.name } });
    return NextResponse.json({ message: "Item updated", item: serialize(item) }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Update item error:", error);
    return errorResponse("Unable to update item", 500);
  }
}

export async function DELETE(request, { params }) {
  const user = verifyJWT(request);
  if (!user) return errorResponse("Unauthorized Request", 401);
  const id = await idFrom(params);
  if (!id) return errorResponse("Invalid item id", 400);
  try {
    const item = await (await collection()).findOneAndUpdate(
      { _id: id, status: { $ne: "DELETED" } },
      { $set: { status: "DELETED", deletedAt: new Date(), deletedBy: user.id, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!item) return errorResponse("Item not found", 404);
    await writeItemAudit({ action: "ITEM_DELETE", user, itemId: item._id, details: { name: item.name } });
    return NextResponse.json({ message: "Item deleted" }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Delete item error:", error);
    return errorResponse("Unable to delete item", 500);
  }
}
