import {
  LayoutDashboard,
  UtensilsCrossed,
  Footprints,
  Dumbbell,
  TrendingDown,
  Coins,
  Bot,
  FileBarChart,
  Settings,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/food", label: "Food & Nutrition", icon: UtensilsCrossed },
  { href: "/meal-planner", label: "Meal Planner", icon: CalendarDays },
  { href: "/activity", label: "Activity", icon: Footprints },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/progress", label: "Weight & Progress", icon: TrendingDown },
  { href: "/protein-cost", label: "Protein Cost", icon: Coins },
  { href: "/coach", label: "AI Coach", icon: Bot },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Bottom nav shows a subset (mobile). */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/food", label: "Food", icon: UtensilsCrossed },
  { href: "/activity", label: "Activity", icon: Footprints },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/coach", label: "Coach", icon: Bot },
];
