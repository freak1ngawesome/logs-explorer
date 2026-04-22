"use client";

import { ScrollText, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

function SidebarToggle() {
  const { toggleSidebar, state } = useSidebar();
  const expanded = state === "expanded";

  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      className="text-muted-foreground"
    >
      {expanded ? (
        <PanelLeftClose className="h-4 w-4 shrink-0" />
      ) : (
        <PanelLeftOpen className="h-4 w-4 shrink-0" />
      )}
      {expanded && <span className="text-sm">Collapse</span>}
    </SidebarMenuButton>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="p-2">
        <SidebarMenu className="gap-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive
              tooltip="Logs"
              render={<a href="/logs" />}
            >
              <ScrollText />
              <span>Logs</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {Array.from({ length: 5 }).map((_, i) => (
            <SidebarMenuItem key={i}>
              <SidebarMenuButton>
                <Skeleton className="h-4 w-4 shrink-0 rounded-full bg-muted-foreground/20" />
                <Skeleton className="h-4 w-40 bg-muted-foreground/20" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="gap-3 p-2">
        <div className="flex justify-start">
          <SidebarToggle />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-muted-foreground/20" />
          <div className="min-w-0 space-y-1 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3 w-20 bg-muted-foreground/20" />
            <Skeleton className="h-3 w-14 bg-muted-foreground/20" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
