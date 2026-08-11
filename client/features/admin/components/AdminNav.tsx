"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import LogoutButton from "@/features/auth/components/LogoutButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Badge from "@/components/ui/Badge";
import { useGetAdminStatsQuery } from "@/features/admin/adminApiSlice";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data } = useGetAdminStatsQuery();
  const pendingWithdrawCount = data?.stats?.pendingWithdrawCount ?? 0;

  const renderLinks = (onNavigate?: () => void) =>
    links.map((link) => {
      const active = pathname === link.href;
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={`flex items-center justify-between gap-2 min-h-11 px-3 py-2 rounded-md text-sm text-brand-foreground transition-colors ${
            active ? "bg-white/15 font-medium" : "hover:bg-white/10"
          }`}
        >
          <span>{link.label}</span>
          {link.href === "/admin/withdrawals" && pendingWithdrawCount > 0 && (
            <Badge variant="warning">{pendingWithdrawCount}</Badge>
          )}
        </Link>
      );
    });

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-brand text-brand-foreground px-2 h-14 border-b border-white/10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer text-brand-foreground hover:bg-white/10 rounded-md transition-colors"
        >
          <AiOutlineMenu size={24} />
        </button>
        <h2 className="text-base font-semibold flex items-center gap-2">
          Admin
          {pendingWithdrawCount > 0 && (
            <Badge variant="warning">{pendingWithdrawCount}</Badge>
          )}
        </h2>
        <ThemeToggle className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-brand-foreground hover:bg-white/10 cursor-pointer transition-colors" />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-45">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <nav
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="fixed top-0 left-0 h-full w-64 bg-brand text-brand-foreground p-4 space-y-1 overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Admin</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer text-brand-foreground hover:bg-white/10 rounded-md transition-colors"
              >
                <AiOutlineClose size={22} />
              </button>
            </div>
            {renderLinks(() => setOpen(false))}
            <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center min-h-11 px-3 py-2 rounded-md text-sm text-brand-foreground hover:bg-white/10 transition-colors"
              >
                Back to Store
              </Link>
              <AdminLogout onDone={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:flex-col w-56 shrink-0 bg-brand text-brand-foreground min-h-screen p-4 space-y-1 border-r border-white/10">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-semibold">Admin</h2>
          <ThemeToggle className="h-9 w-9 flex items-center justify-center rounded-full text-brand-foreground hover:bg-white/10 cursor-pointer transition-colors" />
        </div>
        {renderLinks()}
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md text-sm text-brand-foreground hover:bg-white/10 transition-colors"
          >
            Back to Store
          </Link>
          <AdminLogout />
        </div>
      </nav>
    </>
  );
}

function AdminLogout({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  return (
    <LogoutButton
      className="block w-full text-left px-3 py-2 rounded-md text-sm cursor-pointer text-brand-foreground hover:bg-white/10 disabled:opacity-60 transition-colors"
      onLoggedOut={() => {
        onDone?.();
        router.push("/");
      }}
    />
  );
}