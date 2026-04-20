import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUploadUrl } from "@/lib/storage";

const bodySchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await getUploadUrl(parsed.data.filename, parsed.data.contentType);
  return NextResponse.json(result);
}
