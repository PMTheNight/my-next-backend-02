import { getClientPromise } from "@/lib/mongodb";

export async function writeItemAudit({ action, user, itemId, details = {} }) {
  try {
    const client = await getClientPromise();
    await client.db(process.env.DB_NAME).collection("audit_log").insertOne({
      action,
      entity: "item",
      itemId: itemId?.toString(),
      userId: user?.id?.toString(),
      username: user?.username,
      email: user?.email,
      details,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Unable to write item audit log:", error);
  }
}
