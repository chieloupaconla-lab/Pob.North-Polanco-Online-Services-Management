import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Request Status",
  robots: { index: false, follow: false },
};

export default function DocumentStatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
