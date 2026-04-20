"use client";

import { useMemo, useState } from "react";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  availableTags: { id: string; name: string }[];
  disabled?: boolean;
};

export function TagInput({
  value,
  onChange,
  availableTags,
  disabled,
}: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLower = useMemo(
    () => new Set(value.map((v) => v.toLocaleLowerCase("de-DE"))),
    [value],
  );

  const trimmed = query.trim();
  const trimmedLower = trimmed.toLocaleLowerCase("de-DE");
  const exactMatch = availableTags.some(
    (t) => t.name.toLocaleLowerCase("de-DE") === trimmedLower,
  );
  const isAlreadySelected = selectedLower.has(trimmedLower);

  function addTag(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (selectedLower.has(clean.toLocaleLowerCase("de-DE"))) return;
    onChange([...value, clean]);
    setQuery("");
  }

  function removeTag(name: string) {
    onChange(
      value.filter(
        (v) =>
          v.toLocaleLowerCase("de-DE") !== name.toLocaleLowerCase("de-DE"),
      ),
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((name) => (
          <Badge key={name} variant="secondary" className="gap-1 pr-1">
            <TagIcon className="size-3" />
            {name}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(name)}
                aria-label={`Tag "${name}" entfernen`}
                className="ml-1 rounded-sm hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
              >
                <Plus className="size-4" />
                Tag
              </Button>
            }
          />
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Tag suchen oder erstellen…"
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {trimmed && !isAlreadySelected
                    ? "Tippe Enter, um zu erstellen"
                    : "Keine Tags gefunden."}
                </CommandEmpty>
                {availableTags.length > 0 && (
                  <CommandGroup heading="Vorhanden">
                    {availableTags.map((t) => {
                      const isSelected = selectedLower.has(
                        t.name.toLocaleLowerCase("de-DE"),
                      );
                      return (
                        <CommandItem
                          key={t.id}
                          value={t.name}
                          data-checked={isSelected}
                          onSelect={() => {
                            if (isSelected) removeTag(t.name);
                            else addTag(t.name);
                          }}
                        >
                          <TagIcon
                            className={cn(
                              "size-3",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                          {t.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {trimmed && !exactMatch && !isAlreadySelected && (
                  <CommandGroup heading="Erstellen">
                    <CommandItem
                      value={`__create__${trimmed}`}
                      onSelect={() => addTag(trimmed)}
                    >
                      <Plus className="size-3" />+ &quot;{trimmed}&quot;
                      erstellen
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
