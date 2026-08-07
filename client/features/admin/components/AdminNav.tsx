"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { useRouter } from "next/navigation";

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
  return (
    <nav className="w-56 shrink-0 bg-[#3321c8] text-white min-h-screen p-4 space-y-1">
      <h2 className="text-lg font-semibold mb-4 px-2">Admin</h2>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-md text-sm ${
              active ? "bg-white/20 font-medium" : "hover:bg-white/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <div className="pt-4 mt-4 border-t border-white/20">
        <Link
          href="/"
          className="block px-3 py-2 rounded-md text-sm hover:bg-white/10"
        >
          Back to Store
        </Link>

        <AdminLogout />
      </div>
    </nav>
  );
}

function AdminLogout() {
  const router = useRouter();
  return (
    <LogoutButton
      className="block w-full text-left px-3 py-2 rounded-md text-sm hover:bg-white/10 disabled:opacity-60"
      onLoggedOut={() => router.push("/")}
    />
  );
}
