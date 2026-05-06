import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 10_000_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFile(buffer, file.name, file.type);
  return NextResponse.json(result);
}
