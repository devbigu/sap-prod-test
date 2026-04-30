"use client";

import { useState, useEffect } from "react";

import Sidebar from "@/components/layout/sidebar";
import SmartSearchBar from "@/components/SartSearchBar";
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
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { setUser(resolveUser()); }, []);

  const role: Role = user?.role ?? "admin";

  // ── Display name — matches embedded logic per role ──
  const displayName =
    role === "dealer" ? (user?.Dealer_Name || "Dealer") :
      role === "staff" ? (user?.staff_name || "Staff") :
        user?.name ?? user?.username ?? "Admin";

  // ── Subtitle ──
  const displaySub =
    role === "dealer" ? user?.Dealer_City ?? "Dealer dashboard" :
      role === "staff" ? [user?.staff_location, user?.staff_designation].filter(Boolean).join(" · ") || `ID: ${user?.staff_id ?? ""}` :
        "System administration dashboard";

  // ── Per-role search placeholder ──
  const searchPlaceholder =
    role === "admin" ? "Search orders, dealers, staff…" :
      role === "dealer" ? "Search orders, products…" :
        "Search orders, dealers…";

  // ── User ID for API calls that need an id param ──
  const userId =
    role === "dealer" ? user?.Dealer_Id :
      role === "staff" ? user?.staff_id :
        undefined;

  return (
    <>
      <style>{`
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
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff;
          transition: background .15s;
        }
        .dl-hamburger:hover { background: rgba(255,255,255,0.12); }
        .dl-title { font-size: 15px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-sub   { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'DM Sans', sans-serif" }}>

        <Sidebar open={open} onClose={() => setOpen(false)} />

        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* ── Topbar ── */}
          <header className="dl-topbar">

            {/* Hamburger */}
            <button
              className="dl-hamburger"
              onClick={() => setOpen((v) => !v)}
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

            {/* Welcome + subtitle */}
            <div style={{ minWidth: 0 }}>
              <div className="dl-title">
                {user ? `Welcome, ${displayName}` : "Dashboard"}
              </div>
              {displaySub && <div className="dl-sub">{displaySub}</div>}
            </div>

            {/* ── Smart Search (replaces original dumb search box) ── */}
            <SmartSearchBar
              role={role}
              userId={userId}
              placeholder={searchPlaceholder}
            />

          </header>

          {/* Page content */}
          <main style={{ flex: 1 }}>
            {children}
          </main>

        </div>
      </div>
    </>
  );
}