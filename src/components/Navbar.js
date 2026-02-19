'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out');
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

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

        {pathname.startsWith('/admin') && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-red-300/60 hover:text-red-300 hover:bg-red-500/10 ml-2 border-l border-white/10"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}

