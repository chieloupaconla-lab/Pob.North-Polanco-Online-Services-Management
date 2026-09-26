"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  AlertTriangle,
  Package,
  PhoneCall,
  ShieldCheck,
  Menu,
  X,
  Lock,
  Bell,
} from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-indigo-100 shadow-sm">
      {/* =========================================================
          TOP BANNER
      ========================================================== */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white">
        <div className="mx-auto w-full max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1.5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            {/* Portal Notice */}
            <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse"
                aria-hidden="true"
              />

              <span className="text-[10px] font-medium leading-tight sm:text-xs">
                Official Portal — Barangay Poblacion North, Polanco, Zamboanga
                del Norte
              </span>
            </div>

            {/* Hall Information */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[9px] font-medium text-indigo-100 sm:justify-end sm:text-[11px]">
              <span>Barangay Hall: Mon–Fri, 8:00 AM – 5:00 PM</span>

              <span className="hidden md:inline text-indigo-300">|</span>

              <span className="hidden sm:inline font-semibold text-amber-300">
                No Login Required for Residents
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN NAVBAR
      ========================================================== */}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex min-h-[76px] items-center justify-between gap-2 py-3 sm:min-h-[84px] sm:gap-4">
          {/* =====================================================
              LOGO & BRANDING
          ====================================================== */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="group flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5"
          >
            {/* Logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-md shadow-indigo-200 transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:w-12">
              <Building2 className="h-5 w-5 stroke-[2.2] sm:h-7 sm:w-7" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center">
                <span className="inline-block max-w-full truncate rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-indigo-700 sm:px-2 sm:text-[10px] sm:tracking-wider">
                  Republic of the Philippines
                </span>
              </div>

              <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700 sm:text-lg md:text-xl">
                Barangay Poblacion North
              </h1>

              <p className="truncate text-[9px] font-medium leading-tight text-slate-500 sm:text-xs">
                Municipality of Polanco, Zamboanga del Norte
              </p>
            </div>
          </Link>

          {/* =====================================================
              DESKTOP NAVIGATION
          ====================================================== */}
          <nav className="hidden shrink-0 items-center gap-1 font-medium text-sm text-slate-700 lg:flex">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center rounded-lg bg-indigo-50/80 px-3 py-2 font-semibold text-indigo-900 transition-colors hover:bg-indigo-100"
            >
              Home
            </Link>

            {/* Documents */}
            <Link
              href="/documents"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 hover:text-indigo-700"
            >
              <FileText className="h-4 w-4 text-indigo-600" />
              Document Requests
            </Link>

            {/* Complaints */}
            <Link
              href="/complaints"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 hover:text-indigo-700"
            >
              <AlertTriangle className="h-4 w-4 text-violet-600" />
              Complaints
            </Link>

            {/* Assets */}
            <Link
              href="/assets"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 hover:text-indigo-700"
            >
              <Package className="h-4 w-4 text-indigo-600" />
              Asset Borrowing & Returning
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative ml-1 flex items-center justify-center rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Bell className="h-5 w-5" />

              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white"
                aria-hidden="true"
              />
            </Link>
          </nav>

          {/* =====================================================
              DESKTOP ADMIN
          ====================================================== */}
          <div className="hidden shrink-0 items-center lg:flex">
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-800 hover:shadow"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin Personnel Login
            </Link>
          </div>

          {/* =====================================================
              MOBILE ACTIONS
          ====================================================== */}
          <div className="flex shrink-0 items-center gap-1 lg:hidden">
            {/* Notification */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 sm:h-10 sm:w-10"
            >
              <Bell className="h-5 w-5" />

              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white"
                aria-hidden="true"
              />
            </Link>

            {/* Admin */}
            <Link
              href="/admin/login"
              aria-label="Admin Login"
              title="Admin Login"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 transition-colors hover:bg-indigo-100 sm:h-10 sm:w-auto sm:px-3"
            >
              <Lock className="h-3.5 w-3.5" />

              <span className="ml-1.5 hidden text-xs font-semibold sm:inline">
                Admin
              </span>
            </Link>

            {/* Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 sm:h-10 sm:w-10"
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE NAVIGATION
      ========================================================== */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white shadow-lg lg:hidden">
          <nav className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6">
            <div className="space-y-1.5">
              {/* Home */}
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
              >
                <Building2 className="h-5 w-5 text-indigo-600" />
                Home
              </Link>

              {/* Documents */}
              <Link
                href="/documents"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <FileText className="h-5 w-5 shrink-0 text-indigo-600" />
                <span>Document Requests</span>
              </Link>

              {/* Complaints */}
              <Link
                href="/complaints"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-violet-600" />
                <span>Complaint Management</span>
              </Link>

              {/* Assets */}
              <Link
                href="/assets"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Package className="h-5 w-5 shrink-0 text-indigo-600" />
                <span>Asset Borrowing & Returning</span>
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                <Bell className="h-5 w-5 shrink-0 text-violet-600" />
                <span>Notifications</span>

                <span className="ml-auto h-2 w-2 rounded-full bg-violet-600" />
              </Link>

              {/* Guidelines */}
              <Link
                href="/guidelines"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>Guidelines & Policies</span>
              </Link>

              {/* Emergency Hotlines */}
              <Link
                href="/hotlines"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <PhoneCall className="h-5 w-5 shrink-0 text-red-500" />
                <span>Emergency Hotlines</span>
              </Link>

              {/* Admin */}
              <div className="border-t border-slate-100 pt-2">
                <Link
                  href="/admin/login"
                  onClick={closeMobileMenu}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800"
                >
                  <Lock className="h-4 w-4" />
                  Admin Personnel Portal Login
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}