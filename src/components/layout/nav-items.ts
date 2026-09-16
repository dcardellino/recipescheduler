import {
  BookOpen,
  CalendarDays,
  LibraryBig,
  ShoppingBasket,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/recipes", label: "Library", icon: BookOpen },
  { href: "/cookbooks", label: "Kochbücher", icon: LibraryBig },
  { href: "/week", label: "Woche", icon: CalendarDays },
  { href: "/shopping", label: "Liste", icon: ShoppingBasket },
  { href: "/settings", label: "Einstellungen", icon: Settings },
] as const;
