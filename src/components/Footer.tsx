import React from "react";
import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Clock, Lock, ShieldAlert } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Office Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Barangay Poblacion North
                </h3>
                <p className="text-xs text-slate-400">Municipality of Polanco</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Serving the residents of Barangay Poblacion North, Polanco, Zamboanga del Norte with accessible, transparent, and responsive local government services.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 px-3 py-1.5 rounded-md text-xs font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Residency Validation Enforced</span>
              </div>
            </div>
          </div>

          {/* Column 2: Public Services */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Public Portal Services
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/documents" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Document Requests
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Complaint Management
                </Link>
              </li>
              <li>
                <Link href="/assets" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Asset Borrowing and Returning
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Guidelines & Responsibilities
                </Link>
              </li>
              <li>
                <Link href="/hotlines" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Emergency Hotlines
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Location */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Barangay Contact Info
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Barangay Hall, Poblacion North, Polanco, Zamboanga del Norte, Philippines 7106</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Monday – Friday: 8:00 AM – 5:00 PM</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>(065) 123-4567 / Emergency Hotlines</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>poblacionnorth.polanco@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Important Reminders & Admin Link */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Official Notice
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              All resident submissions are verified against local barangay records. Entering a street or purok alone does not automatically guarantee issuance or approval.
            </p>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <p className="text-[11px] text-slate-300 font-medium mb-2">
                Authorized Barangay Personnel Access:
              </p>
              <Link 
                href="/admin/login" 
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin Dashboard Login
              </Link>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Barangay Poblacion North, Municipality of Polanco. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Official Government Portal</span>
            <span>•</span>
            <span>Polanco, Zamboanga del Norte</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
