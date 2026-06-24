export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, exportChildData } from "@/lib/accounts";
import { getAdminUnlock } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require admin unlock
  const unlocked = (await getAdminUnlock()) === accountId;
  if (!unlocked) {
    return NextResponse.json({ error: "Admin zone not unlocked" }, { status: 403 });
  }

  const personId = req.nextUrl.searchParams.get("personId") ?? "";
  if (!personId) {
    return NextResponse.json({ error: "Missing personId" }, { status: 400 });
  }

  // Verify the target profile belongs to this account
  const profiles = await listProfiles(accountId);
  const target = profiles.find((p) => p.id === personId);
  if (!target || target.kind !== "child") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await exportChildData(accountId, personId);

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="child-data-${personId}.json"`,
    },
  });
}
