import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { CookbookListItem } from "@/lib/queries/cookbooks";

type CookbookCardProps = {
  cookbook: CookbookListItem;
};

export function CookbookCard({ cookbook }: CookbookCardProps) {
  const [cover, ...rest] = cookbook.coverImageUrls;

  return (
    <Link
      href={`/cookbooks/${cookbook.id}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-accent-rust focus-visible:outline-none"
    >
      <div className="relative aspect-[16/9] w-full bg-muted">
        {cover ? (
          <div className="flex h-full w-full gap-0.5">
            <div className="relative h-full flex-[2] overflow-hidden">
              <Image
                src={cover}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                unoptimized
              />
            </div>
            {rest.length > 0 && (
              <div className="flex h-full flex-1 flex-col gap-0.5">
                {rest.slice(0, 3).map((url) => (
                  <div key={url} className="relative flex-1 overflow-hidden">
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="size-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-heading text-lg leading-tight line-clamp-2">
          {cookbook.name}
        </h3>
        {cookbook.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {cookbook.description}
          </p>
        )}
        <span className="mt-auto pt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {cookbook.recipeCount}{" "}
          {cookbook.recipeCount === 1 ? "Rezept" : "Rezepte"}
        </span>
      </div>
    </Link>
  );
}
