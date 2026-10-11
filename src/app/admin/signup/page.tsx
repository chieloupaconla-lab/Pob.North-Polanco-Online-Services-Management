import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminSignupForm from "./AdminSignupForm";
import { STAFF_ACCESS_COOKIE, verifyStaffAccessToken } from "@/lib/staffAccess";

export const dynamic = "force-dynamic";

export default async function AdminSignupPage() {
  const cookieStore = await cookies();
  const staffAccessToken = cookieStore.get(STAFF_ACCESS_COOKIE)?.value || "";

  if (!verifyStaffAccessToken(staffAccessToken)) {
    redirect("/staff-access");
  }

  return <AdminSignupForm />;
}
