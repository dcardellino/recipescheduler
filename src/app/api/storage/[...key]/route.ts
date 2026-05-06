import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, bucket } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
    );

    const stream = obj.Body?.transformToWebStream();
    if (!stream) return new Response(null, { status: 404 });

    const headers = new Headers();
    if (obj.ContentType) headers.set("Content-Type", obj.ContentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(stream, { headers });
  } catch {
    return new Response(null, { status: 404 });
  }
}
