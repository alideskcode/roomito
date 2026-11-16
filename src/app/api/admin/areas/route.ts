import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireAdmin, errorResponse, jsonObject } from "@/lib/http";
import { text, titleCaseArea } from "@/lib/validation";
import { PINNED_AREAS } from "@/lib/constants";

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body)) return errorResponse("Invalid area update.");
  const id = typeof body.id === "string" ? body.id : "";
  const action = body.action;

  if (action === "pin") {
    if (typeof body.pinned !== "boolean") return errorResponse("Choose whether to pin the area.");
    const area = await query<{ name: string }>("SELECT name FROM areas WHERE id = $1", [id]);
    if (!area.rows[0]) return errorResponse("Area not found.", 404);
    if (!body.pinned && PINNED_AREAS.includes(area.rows[0].name)) {
      return errorResponse("Graphic Era University, Turner Road, and ISBT must stay pinned.", 409);
    }
    const result = await query("UPDATE areas SET is_pinned = $1 WHERE id = $2 RETURNING id", [body.pinned, id]);
    return result.rowCount ? NextResponse.json({ ok: true }) : errorResponse("Area not found.", 404);
  }
  if (action === "rename") {
    const name = titleCaseArea(text(typeof body.name === "string" ? body.name : "", 100));
    if (!name) return errorResponse("Enter an area name.");
    try {
      await transaction(async (client) => {
        const area = await client.query<{ name: string }>("SELECT name FROM areas WHERE id = $1 FOR UPDATE", [id]);
        if (!area.rows[0]) throw new Error("Area not found.");
        if (PINNED_AREAS.includes(area.rows[0].name)) {
          throw new Error("Graphic Era University, Turner Road, and ISBT cannot be renamed.");
        }
        await client.query("UPDATE owner_submissions SET area = $1 WHERE area = $2", [name, area.rows[0].name]);
        await client.query("UPDATE areas SET name = $1 WHERE id = $2", [name, id]);
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        return errorResponse("An area with that name already exists. Use merge instead.", 409);
      }
      if (error instanceof Error && error.message === "Area not found.") return errorResponse(error.message, 404);
      if (error instanceof Error && error.message.includes("cannot be renamed")) return errorResponse(error.message, 409);
      throw error;
    }
  }
  if (action === "merge") {
    const targetId = typeof body.targetId === "string" ? body.targetId : "";
    if (!targetId || targetId === id) return errorResponse("Choose a different destination area.");
    try {
      await transaction(async (client) => {
        const areas = await client.query<{ id: string; name: string }>(
          "SELECT id, name FROM areas WHERE id = ANY($1::uuid[]) FOR UPDATE",
          [[id, targetId]],
        );
        if (areas.rowCount !== 2) throw new Error("Choose two existing areas to merge.");
        const source = areas.rows.find((area) => area.id === id);
        const target = areas.rows.find((area) => area.id === targetId);
        if (!source || !target) throw new Error("Choose two existing areas to merge.");
        if (PINNED_AREAS.includes(source.name)) {
          throw new Error("Graphic Era University, Turner Road, and ISBT cannot be merged.");
        }
        await client.query("UPDATE owner_submissions SET area = $1 WHERE area = $2", [target.name, source.name]);
        await client.query("DELETE FROM areas WHERE id = $1", [source.id]);
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Choose two")) return errorResponse(error.message, 404);
      if (error instanceof Error && error.message.includes("cannot be merged")) return errorResponse(error.message, 409);
      throw error;
    }
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    const area = await query<{ name: string }>("SELECT name FROM areas WHERE id = $1", [id]);
    if (!area.rows[0]) return errorResponse("Area not found.", 404);
    if (PINNED_AREAS.includes(area.rows[0].name)) {
      return errorResponse("Graphic Era University, Turner Road, and ISBT cannot be deleted.", 409);
    }
    const used = await query<{ count: number }>("SELECT COUNT(*)::int AS count FROM owner_submissions WHERE area = (SELECT name FROM areas WHERE id = $1)", [id]);
    if (Number(used.rows[0]?.count) > 0) return errorResponse("This area has listings. Merge it into another area first.", 409);
    const result = await query("DELETE FROM areas WHERE id = $1 RETURNING id", [id]);
    return result.rowCount ? NextResponse.json({ ok: true }) : errorResponse("Area not found.", 404);
  }
  return errorResponse("Choose rename, merge, pin, or delete.");
}
