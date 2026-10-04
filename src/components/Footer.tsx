
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-8 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center text-xs text-slate-500 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} Barangay Poblacion North,
            Municipality of Polanco. All rights reserved.
          </p>

          <div className="flex gap-4">
            <span>Official Government Portal</span>
            <span>•</span>
            <span>Polanco, Zamboanga del Norte</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

