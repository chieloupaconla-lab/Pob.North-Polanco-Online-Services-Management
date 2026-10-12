"use client";



import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {

  Bell,

  Archive,

  ChevronDown,

  Home,

  Menu,

  Settings,

  FileText,

  MessageSquare,

  Package,

  Warehouse,

  Users,

  History,

  LogOut,

  X,

} from "lucide-react";

import {

  collection,

  doc,

  limit,

  onSnapshot,

  orderBy,

  query,

  where,

  Timestamp,

  updateDoc,

  writeBatch,

} from "firebase/firestore";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";



import { auth, db } from "@/lib/firebase";

import { formatNameForDisplay } from "@/lib/nameUtils";



interface AdminHeaderProps {

  pathname: string;

  mobileSidebarOpen?: boolean;

  onToggleMobileSidebar?: () => void;

  notificationsEnabled?: boolean;

}



const pageLabels: Record<string, string> = {

  "/admin": "Dashboard",

  "/admin/documents": "Document Requests",

  "/admin/complaints": "Complaints",

  "/admin/assets": "Asset Borrowing",

  "/admin/residents": "Resident Registry",

  "/admin/inventory": "Equipment Inventory",

  "/admin/users": "Users",

  "/admin/settings": "Settings",

  "/admin/activity-log": "Activity Log",

  "/admin/notifications": "Notifications",

  "/admin/archive": "Archive",

};



const moduleIcons: Record<string, typeof Home> = {

  "/admin": Home,

  "/admin/documents": FileText,

  "/admin/complaints": MessageSquare,

  "/admin/assets": Package,

  "/admin/residents": Users,

  "/admin/inventory": Warehouse,

  "/admin/users": Users,

  "/admin/settings": Settings,

  "/admin/activity-log": History,

  "/admin/notifications": Bell,

  "/admin/archive": Archive,

};



type HeaderNotification = {

  id: string;

  title: string;

  message: string;

  actionUrl?: string;

  read: boolean;

  createdAt: Timestamp | null;

};



function formatRelativeTime(timestamp: Timestamp | null) {

  if (!timestamp) return "Processing time";



  const elapsed = Date.now() - timestamp.toMillis();

  const minutes = Math.floor(elapsed / 60000);



  if (minutes < 1) return "Just now";

  if (minutes < 60) return `${minutes}m ago`;



  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;



  const days = Math.floor(hours / 24);

  return `${days}d ago`;

}



function getAdminName(user: User) {

  const displayName = user.displayName?.trim();

  if (displayName) return formatNameForDisplay(displayName);



  const emailName = user.email?.split("@")[0] || "Administrator";

  const words = emailName.split(/[.\_-]+/).filter(Boolean);



  return words.length > 0 ? formatNameForDisplay(words.join(" ")) : "Administrator";

}



export default function AdminHeader({

  pathname,

  mobileSidebarOpen,

  onToggleMobileSidebar,

  notificationsEnabled = true,

}: AdminHeaderProps) {

  const router = useRouter();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  const [notifications, setNotifications] =

    useState<HeaderNotification[]>([]);

  const [adminProfile, setAdminProfile] = useState({

    name: "Administrator",

    email: "",

  });



  const currentPage = pageLabels[pathname] || "Admin";

  const CurrentIcon = moduleIcons[pathname] || Home;

  const profileRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {

      setAdminProfile(

        user

          ? {

              name: getAdminName(user),

              email: user.email || "",

            }

          : { name: "Administrator", email: "" }

      );

    });



    return unsubscribeAuth;

  }, []);



  useEffect(() => {
    if (!notificationsEnabled) {
      return;
    }

    let active = true;
    let unsubscribeNotifications: (() => void) | null = null;

    const stopNotificationsListener = () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Avoid leaving a previous user's notification listener active.
      stopNotificationsListener();

      if (!user) {
        setNotifications([]);
        return;
      }

      void user
        .getIdToken()
        .then(() => {
          // The component may have unmounted while the token was loading.
          if (!active || auth.currentUser?.uid !== user.uid) {
            return;
          }

          const notificationsQuery = query(
            collection(db, "notifications"),
            where("recipientType", "==", "admin"),
            orderBy("createdAt", "desc"),
            limit(20)
          );

          unsubscribeNotifications = onSnapshot(
            notificationsQuery,
            (snapshot) => {
              if (!active) return;

              const nextNotifications: HeaderNotification[] =
                snapshot.docs.map((notification) => {
                  const data = notification.data();

                  return {
                    id: notification.id,
                    title: String(data.title || "Notification"),
                    message: String(data.message || ""),
                    ...(typeof data.actionUrl === "string"
                      ? { actionUrl: data.actionUrl }
                      : {}),
                    read: data.read === true,
                    createdAt:
                      data.createdAt instanceof Timestamp
                        ? data.createdAt
                        : null,
                  };
                });

              setNotifications(nextNotifications);
            },
            (error) => {
              console.error("Admin notification listener error:", error);
            }
          );
        })
        .catch((error) => {
          if (active) {
            console.error("Unable to prepare admin notification listener:", error);
          }
        });
    });

    return () => {
      active = false;
      unsubscribeAuth();
      stopNotificationsListener();
    };
  }, [notificationsEnabled]);

  useEffect(() => {

    const handleOutsideClick = (event: MouseEvent) => {

      if (

        profileRef.current &&

        !profileRef.current.contains(event.target as Node)

      ) {

        setProfileOpen(false);

      }

    };



    document.addEventListener("mousedown", handleOutsideClick);

    return () =>

      document.removeEventListener("mousedown", handleOutsideClick);

  }, []);



  const unreadCount = notifications.filter(

    (notification) => !notification.read

  ).length;



  const markAsReadAndOpen = async (

    notification: HeaderNotification

  ) => {

    if (!notification.read) {

      await updateDoc(

        doc(db, "notifications", notification.id),

        { read: true }

      ).catch((error) =>

        console.error("Unable to mark notification read:", error)

      );

    }



    setNotificationsOpen(false);

    router.push(

      notification.actionUrl ||

        "/admin/notifications"

    );

  };



  const markAllAsRead = async () => {

    const unread = notifications.filter(

      (notification) => !notification.read

    );



    if (unread.length === 0) return;



    const batch = writeBatch(db);

    unread.forEach((notification) => {

      batch.update(

        doc(db, "notifications", notification.id),

        { read: true }

      );

    });



    await batch.commit().catch((error) =>

      console.error("Unable to mark notifications read:", error)

    );

  };



  const handleLogout = async () => {

    if (signingOut) return;



    setSigningOut(true);



    try {

      await signOut(auth);

      router.replace("/admin/login");

    } catch (error) {

      console.error("Unable to sign out admin:", error);

      setSigningOut(false);

    }

  };



  return (

    <header className="safe-area-top sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm sm:px-6">

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">

        {onToggleMobileSidebar && (

          <button

            type="button"

            onClick={onToggleMobileSidebar}

            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"

            aria-label={

              mobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"

            }

          >

            {mobileSidebarOpen ? (

              <X className="h-5 w-5" />

            ) : (

              <Menu className="h-5 w-5" />

            )}

          </button>

        )}



        <div className="flex min-w-0 items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">

            <CurrentIcon className="h-5 w-5" />

          </div>



           <div className="min-w-0">

             <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">

              {currentPage}

            </h1>



            <p className="hidden text-xs text-gray-500 sm:block">

              Barangay Poblacion North Administration

            </p>

          </div>

        </div>

      </div>



      <div className="flex shrink-0 items-center gap-1 sm:gap-2">

        <div className="relative">

          <button

            type="button"

            onClick={() =>

              notificationsEnabled

                ? setNotificationsOpen(!notificationsOpen)

                : router.push("/admin/notifications")

            }

             className="relative flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"

            aria-label="Notifications"

          >

            <Bell className="h-5 w-5" />



            {unreadCount > 0 && (

              <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">

                {unreadCount > 99 ? "99+" : unreadCount}

              </span>

            )}

          </button>



          {notificationsOpen && (

            <div className="absolute right-0 top-12 z-50 max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-lg">

              <div className="mb-3 flex items-center justify-between">

                <h3 className="font-semibold text-gray-900">Notifications</h3>



                <div className="flex items-center gap-2">

                  {unreadCount > 0 && (

                    <button

                      type="button"

                      onClick={() => void markAllAsRead()}

                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"

                    >

                      Mark all read

                    </button>

                  )}

                  <button

                    type="button"

                    onClick={() => setNotificationsOpen(false)}

             className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"

                    aria-label="Close notifications"

                  >

                    <X className="h-4 w-4" />

                  </button>

                </div>

              </div>



              {notifications.length === 0 ? (

                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">

                  No notifications. You&apos;re all caught up.

                </p>

              ) : (

                <div className="max-h-96 space-y-2 overflow-y-auto">

                  {notifications.slice(0, 5).map((notification) => (

                    <button

                      key={notification.id}

                      type="button"

                      onClick={() => void markAsReadAndOpen(notification)}

                      className={`block w-full rounded-lg p-3 text-left transition hover:bg-indigo-50 ${

                        notification.read ? "bg-white" : "bg-indigo-50/60"

                      }`}

                    >

                      <div className="flex items-start gap-2">

                        {!notification.read && (

                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />

                        )}

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-gray-800">

                            {notification.title}

                          </p>

                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">

                            {notification.message}

                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">

                            {formatRelativeTime(notification.createdAt)}

                          </p>

                        </div>

                      </div>

                    </button>

                  ))}

                </div>

              )}



              <Link

                href="/admin/notifications"

                onClick={() => setNotificationsOpen(false)}

                className="mt-3 block border-t border-gray-100 pt-3 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"

              >

                View All Notifications

              </Link>

            </div>

          )}

        </div>



          <div ref={profileRef} className="relative flex min-w-0 items-center gap-1 border-l border-gray-200 pl-2 sm:gap-2 sm:pl-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">

            {adminProfile.name.charAt(0).toUpperCase() || "A"}

          </div>



          <div className="hidden sm:block">

            <p className="max-w-48 truncate text-sm font-medium text-gray-900">

              {adminProfile.name}

            </p>



            <p className="max-w-48 truncate text-xs text-gray-500">

              {adminProfile.email || "No email available"}

            </p>



            <p className="text-xs text-gray-500">Barangay Admin</p>

          </div>



          <button

            type="button"

            onClick={() => setProfileOpen((open) => !open)}

             className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"

            aria-label="Open administrator menu"

            aria-expanded={profileOpen}

          >

            <ChevronDown

              className={`h-4 w-4 transition-transform ${

                profileOpen ? "rotate-180" : ""

              }`}

            />

          </button>



          {profileOpen && (

            <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">

              <button

                type="button"

                onClick={() => {

                  setProfileOpen(false);

                  router.push("/admin/archive");

                }}

                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700"

              >

                <Archive className="h-4 w-4" />

                Archive

              </button>



              <button

                type="button"

               onClick={() => {

                   setProfileOpen(false);

                   router.push("/admin/signup");

                 }}

                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700"

              >

                <Users className="h-4 w-4" />

                 Manage Admin Accounts

               </button>



               <button

                 type="button"

                 onClick={() => {

                   setProfileOpen(false);

                   router.push("/admin/activity-log");

                 }}

                 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"

               >

                 <History className="h-4 w-4" />

                 Activity Log

               </button>



               <button

                type="button"

                onClick={() => void handleLogout()}

                disabled={signingOut}

                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"

              >

                <LogOut className="h-4 w-4" />

                {signingOut ? "Logging out..." : "Log Out"}

              </button>

            </div>

          )}

        </div>

      </div>

    </header>

  );

}
