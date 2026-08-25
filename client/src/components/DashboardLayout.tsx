import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, BellRing, BookOpenCheck, Gauge, LayoutDashboard, LogOut, PanelLeft, ShieldCheck, Wrench } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Control tower", anchor: "overview" },
  { icon: Gauge, label: "Digital twin", anchor: "digital-twin" },
  { icon: Activity, label: "Telemetry", anchor: "telemetry" },
  { icon: BellRing, label: "Conditions", anchor: "conditions" },
  { icon: Wrench, label: "Maintenance", anchor: "maintenance" },
  { icon: BookOpenCheck, label: "Engineering basis", anchor: "engineering" },
];

const SIDEBAR_WIDTH_KEY = "smartpump-sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 220;
const MAX_WIDTH = 340;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout, loading } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.body.style.cursor = "col-resize";
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
    };
  }, [isResizing, setSidebarWidth]);

  const jumpTo = (anchor: string) => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loading) return <div className="min-h-screen bg-[#07111a]" />;
  if (!user) return <div className="grid min-h-screen place-items-center bg-[#07111a] p-6 text-center"><div className="max-w-md rounded-2xl border border-white/10 bg-[#0b1d29] p-8"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-cyan-300/10 text-cyan-100"><ShieldCheck className="h-6 w-6" /></div><h1 className="mt-5 text-2xl font-semibold text-white">SmartPump-X control tower</h1><p className="mt-3 text-sm leading-6 text-slate-400">Sign in to review the protected synthetic demonstrator, calculation basis, and controlled scenario previews.</p><Button onClick={() => startLogin()} className="mt-6 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">Sign in</Button></div></div>;

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-white/8 bg-[#07121b] text-slate-100">
          <SidebarHeader className="h-[84px] border-b border-white/8 px-3 py-4">
            <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10" aria-label="Toggle navigation">
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">SmartPump-X</p><p className="mt-1 text-sm font-medium text-white">Control tower</p></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="py-4">
            <SidebarMenu className="px-2">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.anchor}>
                  <SidebarMenuButton onClick={() => jumpTo(item.anchor)} tooltip={item.label} className="h-10 text-slate-300 hover:bg-white/7 hover:text-white data-[active=true]:bg-cyan-400/10 data-[active=true]:text-cyan-200">
                    <item.icon className="h-4 w-4" /><span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            {!isCollapsed && <div className="mx-4 mt-8 rounded-xl border border-cyan-300/10 bg-cyan-400/[0.04] p-3"><div className="flex items-center gap-2 text-xs font-medium text-cyan-200"><ShieldCheck className="h-4 w-4" /> Demonstration mode</div><p className="mt-2 text-[11px] leading-5 text-slate-400">All present telemetry is synthetic or derived. No physical pump is controlled.</p></div>}
          </SidebarContent>
          <SidebarFooter className="border-t border-white/8 p-3">
            {user ? <div className="space-y-2"><div className="rounded-lg bg-white/5 px-3 py-2 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-slate-100">{user.name ?? "Authenticated user"}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{user.role}</p></div><Button variant="ghost" onClick={logout} className="w-full justify-start text-slate-300 hover:bg-white/8 hover:text-white"><LogOut className="mr-2 h-4 w-4" /><span className="group-data-[collapsible=icon]:hidden">Sign out</span></Button></div> : <Button onClick={() => startLogin()} className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"><span className="group-data-[collapsible=icon]:hidden">Engineer sign in</span><ShieldCheck className="h-4 w-4 group-data-[collapsible=icon]:block hidden" /></Button>}
          </SidebarFooter>
        </Sidebar>
        {!isCollapsed && <div onMouseDown={() => setIsResizing(true)} className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-cyan-300/40" />}
      </div>
      <SidebarInset className="bg-[#07111a] text-slate-100">
        {isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/8 bg-[#07111a]/95 px-3 backdrop-blur"><SidebarTrigger className="border border-white/10 bg-white/5 text-slate-100" /><span className="text-sm font-medium">SmartPump-X</span></div>}
        <main className="min-h-screen flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
