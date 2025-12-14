'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  FileText, 
  Menu, 
  X,
  Home,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Add Product", href: "/admin/products/new", icon: Plus },
    { name: "Reports", href: "/admin/reports", icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(path);
  };

  const cn = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MA</span>
            </div>
            <span className="font-semibold text-lg">Metalyze Admin</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Admin Dashboard 
          {/* change to user icon */}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0 lg:w-16",
          "lg:block"
        )}>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Content will be rendered by Next.js layout */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

