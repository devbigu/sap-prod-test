"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
type Role = "admin" | "dealer" | "staff";

function resolveUser() {
  if (typeof window === "undefined") return null;
  try {
    const staffRaw = localStorage.getItem("staffData");
    if (staffRaw) {
      const p = JSON.parse(staffRaw);
      if (p?.staff_id) return { role: (p.staff_roletype === "0" ? "admin" : "staff") as Role, ...p };
    }
    const userData = localStorage.getItem("UserData");
    if (userData) {
      const p = JSON.parse(userData);
      if (p?.Dealer_Id) return { role: "dealer" as Role, ...p };
      if (p?.staff_id) return { role: (p.staff_roletype === "0" ? "admin" : "staff") as Role, ...p };
      if (localStorage.getItem("roletype") === "3" && p && Object.keys(p).length > 0)
        return { role: "admin" as Role, ...p };
    }
    const adminRaw = localStorage.getItem("AdminData") || localStorage.getItem("admin");
    if (adminRaw) {
      const p = JSON.parse(adminRaw);
      if (p && Object.keys(p).length > 0) return { role: "admin" as Role, ...p };
    }
  } catch (_) { }
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { setUser(resolveUser()); }, []);

  const role: Role = user?.role ?? "admin";

  // ── Display name — matches embedded logic per role ──
  const displayName =
    role === "dealer" ? (user?.Dealer_Name || "Dealer") :
      role === "staff" ? (user?.staff_name || "Staff") :
        user?.name ?? user?.username ?? "Admin";

  // ── Subtitle — city for dealer, location·designation for staff, caption for admin ──
  const displaySub =
    role === "dealer" ? user?.Dealer_City ?? "Dealer dashboard" :
      role === "staff" ? [user?.staff_location, user?.staff_designation].filter(Boolean).join(" · ") || `ID: ${user?.staff_id ?? ""}` :
        "System administration dashboard";

  const searchPlaceholder =
    role === "admin" ? "Search orders, dealers, staff…" :
      role === "dealer" ? "Search orders, products…" :
        "Search orders, dealers…";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/Pages/products?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <>
      <style>{`
        /* Exact topbar styles from embedded dashboard */
        .dl-topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          height: 62px;
          padding: 0 22px;
          background: linear-gradient(to right, #1f4b8d, #0d0c16);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dl-hamburger {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          transition: background .15s;
        }
        .dl-hamburger:hover { background: rgba(255,255,255,0.12); }

        .dl-title { font-size: 15px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-sub   { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px; }

        .dl-search-wrap {
          flex: 1;
          max-width: 480px;
          margin: 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 10px;
          padding: 0 12px;
          height: 38px;
          transition: border-color .2s, background .2s;
        }
        .dl-search-wrap:focus-within {
          border-color: rgba(99,102,241,0.5);
          background: rgba(255,255,255,0.12);
        }
        .dl-search-icon { color: rgba(255,255,255,0.45); flex-shrink: 0; display: flex; align-items: center; }
        .dl-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13.5px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
        }
        .dl-search-input::placeholder { color: rgba(255,255,255,0.35); }
        .dl-clear {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.4); font-size: 18px; line-height: 1;
          padding: 0; flex-shrink: 0; transition: color .15s;
        }
        .dl-clear:hover { color: rgba(255,255,255,0.7); }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Sidebar */}
        <Sidebar open={open} onClose={() => setOpen(false)} />

        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* ── Topbar — exact embedded style ── */}
          <header className="dl-topbar">

            {/* Hamburger */}
            <button
              className="dl-hamburger"
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle sidebar"
            >
              {open ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <img
              src="https://omsonsapp.vercel.app/headicon.png"
              alt="Omsons"
              style={{ height: 44, flexShrink: 0 }}
            />

            {/* Welcome + subtitle — same structure as embedded topbar */}
            <div style={{ minWidth: 0 }}>
              <div className="dl-title">
                {user ? `Welcome, ${displayName}` : "Dashboard"}
              </div>
              {displaySub && (
                <div className="dl-sub">{displaySub}</div>
              )}
            </div>

            {/* Search — same style as embedded .search-wrap */}
            <div className="dl-search-wrap">
              <span className="dl-search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                className="dl-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                autoComplete="off"
              />
              {search && (
                <button className="dl-clear" onClick={() => setSearch("")}>×</button>
              )}
            </div>

          </header>

          {/* Page content — no padding, each page controls its own */}
          <main style={{ flex: 1 }}>
            {children}
          </main>

        </div>
      </div>
    </>
  );
}