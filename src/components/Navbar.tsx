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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-indigo-100 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">
              Official Portal — Barangay Poblacion North, Polanco, Zamboanga del Norte
            </span>
          </div>

          <div className="flex items-center gap-4 text-indigo-100 font-medium">
            <span>Barangay Hall Hours: Mon–Fri, 8:00 AM – 5:00 PM</span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline text-amber-300 font-semibold">
              No Login Required for Residents
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Republic of the Philippines
                </span>
              </div>

              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight group-hover:text-indigo-700 transition-colors">
                Barangay Poblacion North
              </h1>

              <p className="text-xs text-slate-500 font-medium">
                Municipality of Polanco, Zamboanga del Norte
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm text-slate-700">
            {/* Home */}
            <Link
              href="/"
              className="px-3.5 py-2 rounded-lg text-indigo-900 bg-indigo-50/80 font-semibold hover:bg-indigo-100 transition-colors"
            >
              Home
            </Link>

            {/* Document Requests */}
            <Link
              href="/documents"
              className="px-3.5 py-2 rounded-lg hover:text-indigo-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              Document Requests
            </Link>

            {/* Complaints */}
            <Link
              href="/complaints"
              className="px-3.5 py-2 rounded-lg hover:text-indigo-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-violet-600" />
              Complaints
            </Link>

            {/* Asset Borrowing & Returning */}
            <Link
              href="/assets"
              className="px-3.5 py-2 rounded-lg hover:text-indigo-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-indigo-600" />
              Asset Borrowing & Returning
            </Link>

            {/* Notifications - Separate Button */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative ml-1 p-2.5 rounded-xl text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />

              {/* Notification indicator */}
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white"
                aria-hidden="true"
              />
            </Link>
          </nav>

          {/* Admin Access */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/admin/login"
              className="px-4 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Personnel Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Notification Bell */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              <Bell className="w-5 h-5" />

              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white"
                aria-hidden="true"
              />
            </Link>

            {/* Admin */}
            <Link
              href="/admin/login"
              className="p-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            {/* Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {/* Home */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-semibold text-indigo-700 bg-indigo-50"
          >
            Home
          </Link>

          {/* Document Requests */}
          <Link
            href="/documents"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <FileText className="w-5 h-5 text-indigo-600" />
            Document Requests
          </Link>

          {/* Complaint Management */}
          <Link
            href="/complaints"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5 text-violet-600" />
            Complaint Management
          </Link>

          {/* Asset Borrowing */}
          <Link
            href="/assets"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Package className="w-5 h-5 text-indigo-600" />
            Asset Borrowing & Returning
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
          >
            <Bell className="w-5 h-5 text-violet-600" />
            Notifications
          </Link>

          {/* Guidelines */}
          <Link
            href="/guidelines"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Guidelines & Policies
          </Link>

          {/* Emergency Hotlines */}
          <Link
            href="/hotlines"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <PhoneCall className="w-5 h-5 text-red-500" />
            Emergency Hotlines
          </Link>

          {/* Admin Login */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full justify-center px-4 py-2.5 rounded-lg bg-indigo-700 text-white font-medium text-sm flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Admin Personnel Portal Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}