"use client";

import { ReactNode, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

type Item = { label: string; icon?: ReactNode; active?: boolean; onClick?: () => void };

export default function Sidebar({ items, title = "Navigation" }: { items: Item[]; title?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
      "sticky top-24 h-fit rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900",
        collapsed ? "w-[76px]" : "w-full"
      )}
    >
      <div className="mb-2 flex items-center justify-between px-2">
      {!collapsed ? <p className="type-label">{title}</p> : null}
        <Button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          variant="ghost"
          className="h-9 w-9 p-0"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>
      <nav className="grid gap-1">
        {items.map((item) => (
          <Button
            key={item.label}
            onClick={item.onClick}
            variant={item.active ? "primary" : "ghost"}
            title={collapsed ? item.label : undefined}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3 text-left",
              collapsed && "justify-center px-2"
            )}
          >
            {item.icon}
            {!collapsed ? item.label : null}
          </Button>
        ))}
      </nav>
    </aside>
  );
}
