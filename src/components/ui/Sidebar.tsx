import { useState, useCallback, useEffect, useRef } from "react";
import { ConnectionPanel } from "./ConnectionPanel";
import { GeometryExplorer } from "./GeometryExplorer";
import { TrailPanel } from "./TrailPanel";
import { CameraPanel } from "./CameraPanel";
import { GridPanel } from "./GridPanel";
import { RobotSettingsPanel } from "./RobotSettingsPanel";
import { AddGeometryPanel } from "./AddGeometryPanel";
import { ImportGeometryPanel } from "./ImportGeometryPanel";
import { useAppStore } from "../../store/useAppStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { X, GripVertical, ChevronDown, ChevronRight } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const sidebarWidth = useAppStore((state) => state.sidebarWidth);
  const setSidebarWidth = useAppStore((state) => state.setSidebarWidth);

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isConnectionOpen, setIsConnectionOpen] = useState(true);
  const [isViewControlOpen, setIsViewControlOpen] = useState(true);
  const [isGeometryOpen, setIsGeometryOpen] = useState(true);

  const minWidth = 280;
  const maxWidth = Math.min(600, window.innerWidth * 0.5);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing, maxWidth, setSidebarWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 bg-surface flex flex-col z-50 shadow-xl transition-all duration-300 md:relative md:translate-x-0 overflow-hidden",
          !isSidebarOpen
            ? "-translate-x-full md:w-0 md:translate-x-0"
            : "w-full md:border-r md:border-border"
        )}
        style={{
          width: isSidebarOpen
            ? window.innerWidth < 768
              ? "100%"
              : `${sidebarWidth}px`
            : "0",
        }}
      >
        {/* Resize Handle - Desktop Only */}
        {isSidebarOpen && window.innerWidth >= 768 && (
          <div
            onMouseDown={startResizing}
            className={cn(
              "absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-accent/40 transition-colors z-[100] group flex items-center justify-center",
              isResizing && "bg-accent/60"
            )}
          >
            <div className="hidden group-hover:block text-accent/50 pointer-events-none">
              <GripVertical size={16} />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-center flex-shrink-0 relative">
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Live<span className="text-accent">Tracer</span>
            </h1>
            <p className="text-xs text-muted-foreground">Made by Vlarkus</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-accent rounded-md md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
          <section>
            <button
              type="button"
              onClick={() => setIsConnectionOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground uppercase mb-4"
            >
              <span>Link</span>
              {isConnectionOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {isConnectionOpen && <ConnectionPanel />}
          </section>

          <section>
            <button
              type="button"
              onClick={() => setIsViewControlOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground uppercase mb-4"
            >
              <span>View</span>
              {isViewControlOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {isViewControlOpen && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Camera
                  </div>
                  <CameraPanel />
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Grid
                  </div>
                  <GridPanel />
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Robot
                  </div>
                  <RobotSettingsPanel />
                </div>
              </div>
            )}
          </section>

          <section>
            <button
              type="button"
              onClick={() => setIsGeometryOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground uppercase mb-4"
            >
              <span>Model</span>
              {isGeometryOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {isGeometryOpen && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Create
                  </div>
                  <AddGeometryPanel />
                  <ImportGeometryPanel />
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Explore
                  </div>
                  <GeometryExplorer />
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Record
                  </div>
                  <TrailPanel />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};
