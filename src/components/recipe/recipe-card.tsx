import Image from "next/image";
import Link from "next/link";
import { Clock, ImageOff, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RecipeCardProps = {
  id: string;
  title: string;
  imageUrl: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  rating: number | null;
  tags: { id: string; name: string }[];
};

export function RecipeCard({
  id,
  title,
  imageUrl,
  prepMinutes,
  cookMinutes,
  rating,
  tags,
}: RecipeCardProps) {
  const totalMinutes = (prepMinutes ?? 0) + (cookMinutes ?? 0);

  return (
    <Link
      href={`/recipes/${id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-heading text-lg leading-tight line-clamp-2">
          {title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {totalMinutes} min
            </span>
          )}
          {rating != null && (
            <span className="inline-flex items-center gap-1">
              <Star
                className={cn(
                  "size-3",
                  rating > 0 ? "fill-primary text-primary" : "",
                )}
              />
              {rating}
            </span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                {t.name}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
