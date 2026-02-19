'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Wallet } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const NavItem = ({ href, label, icon: Icon }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
          isActive
            ? "bg-white/20 text-white shadow-lg backdrop-blur-md"
            : "text-white/60 hover:text-white hover:bg-white/10"
        )}
      >
        <Icon size={18} />
        <span className="text-sm font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 pb-4">
      <div className="glass rounded-full px-2 py-2 flex items-center gap-1">
        <NavItem href="/" label="Class List" icon={Users} />
        <NavItem href="/admin" label="Admin Control" icon={LayoutDashboard} />
      </div>
    </nav>
  );
}
