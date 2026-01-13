import { Menu, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const SidebarToggle = () => {
    const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const sidebarWidth = useAppStore((state) => state.sidebarWidth);

    return (
        <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={cn(
                "fixed top-4 left-4 z-[60] p-2 rounded-lg bg-surface border border-border shadow-lg transition-all duration-300 hover:bg-accent hover:text-accent-foreground group max-md:hidden",
                isSidebarOpen && "md:left-4"
            )}
            style={
                isSidebarOpen && window.innerWidth >= 768
                    ? { left: `${sidebarWidth + 16}px` }
                    : undefined
            }
            title={isSidebarOpen ? "Hide Options" : "Show Options"}
        >
            {isSidebarOpen ? (
                <X className="w-5 h-5" />
            ) : (
                <Menu className="w-5 h-5" />
            )}
        </button>
    );
};
