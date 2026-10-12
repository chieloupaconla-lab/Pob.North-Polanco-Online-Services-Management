"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Package,
  ShieldCheck,
  UserRound,
  Users,
  Bell,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/activityLog";
import { createAdminNotification } from "@/lib/notifications";
import { ResidentLocationSelect, ResidentVerificationPanel, useResidentVerification } from "@/components/resident/ResidentVerification";
import { isOfficialPurok } from "@/lib/purokConfig";
import {
  EquipmentInventory,
  getAvailableEquipmentInventory,
} from "@/lib/inventoryService";

export default function AssetsPage() {
  const [inventory, setInventory] = useState<EquipmentInventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerContactNumber: "",
    purok: "",
    assetName: "",
    quantity: "1",
    purpose: "",
    borrowDate: "",
    expectedReturnDate: "",
    witnessName: "",
    witnessRelationship: "",
    witnessContactNumber: "",
    penaltyAgreement: false,
  });
  const verificationStatus = useResidentVerification(formData.borrowerName, formData.purok);

  useEffect(() => {
    let active = true;

    const loadInventory = async () => {
      try {
        const data = await getAvailableEquipmentInventory();

        if (!active) return;

        setInventory(data);
      } catch (loadError) {
        console.error("Error loading equipment inventory:", loadError);

        if (active) {
          setInventoryError(
            "Unable to load the asset list. Please try again later."
          );
        }
      } finally {
        if (active) setInventoryLoading(false);
      }
    };

    loadInventory();

    return () => {
      active = false;
    };
  }, []);

  const selectedAsset = inventory.find(
    (item) => item.name === formData.assetName
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const borrower = formData.borrowerName.trim().toLowerCase();
    const witness = formData.witnessName.trim().toLowerCase();

    if (borrower === witness) {
      setError(
        "The witness/checker must be a different person from the borrower."
      );
      return;
    }

    if (!isOfficialPurok(formData.purok)) {
      setError("Please select an official Purok.");
      return;
    }


    if (formData.borrowDate > formData.expectedReturnDate) {
      setError(
        "The expected return date cannot be earlier than the borrow date."
      );
      return;
    }

    if (verificationStatus !== "verified") {
      setError("Please verify your resident information before submitting.");
      return;
    }

    if (!formData.penaltyAgreement) {
      setError(
        "Please agree to the responsibility and penalty conditions before submitting."
      );
      return;
    }

    if (!selectedAsset) {
      setError("Please select an available asset from the inventory.");
      return;
    }

    if (
      Number(formData.quantity) < 1 ||
      Number(formData.quantity) > selectedAsset.availableQuantity
    ) {
      setError(
        `Only ${selectedAsset.availableQuantity} ${selectedAsset.unit} of ${selectedAsset.name} available.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const requestRef = await addDoc(collection(db, "assets"), {
        // Borrower information
        borrowerName: formData.borrowerName.trim(),
        borrowerContactNumber: formData.borrowerContactNumber.trim(),
         purok: formData.purok.trim(),

        // Asset information
        assetName: formData.assetName,
        quantity: Number(formData.quantity),
        purpose: formData.purpose.trim(),

        // Borrowing schedule
        borrowDate: formData.borrowDate,
        expectedReturnDate: formData.expectedReturnDate,

        // Returning information
        actualReturnDate: null,
        returnCondition: "",
        damageDetails: "",
        lossDetails: "",
        penalty: "",

        // Witness / checker
        witnessName: formData.witnessName.trim(),
        witnessRelationship: formData.witnessRelationship.trim(),
        witnessContactNumber: formData.witnessContactNumber.trim(),

        // Request status
        status: "Pending",

        // Admin information
        adminNotes: "",

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await logActivity({
        action: "EQUIPMENT_BORROW_REQUESTED",
        category: "Equipment",
        description: `${formData.borrowerName.trim()} requested to borrow ${formData.quantity} ${formData.assetName}.`,
        actorType: "resident",
        actorName: formData.borrowerName.trim(),
        referenceId: requestRef.id,
        referenceType: "asset",
        status: "Pending",
        metadata: {
          assetName: formData.assetName,
          quantity: Number(formData.quantity),
          borrowDate: formData.borrowDate,
          expectedReturnDate: formData.expectedReturnDate,
        },
      });

      await createAdminNotification({
        title: "New Equipment Borrowing Request",
        message: `${formData.borrowerName.trim()} requested to borrow barangay equipment.`,
        type: "equipment",
        referenceId: requestRef.id,
        referenceType: "asset",
        actionUrl: "/admin/assets",
        metadata: {
          assetName: formData.assetName,
          quantity: Number(formData.quantity),
        },
      });

      setSubmitted(true);

      setFormData({
        borrowerName: "",
        borrowerContactNumber: "",
         purok: "",
        assetName: "",
        quantity: "1",
        purpose: "",
        borrowDate: "",
        expectedReturnDate: "",
        witnessName: "",
        witnessRelationship: "",
        witnessContactNumber: "",
        penaltyAgreement: false,
      });
    } catch (err) {
      console.error("Asset request submission error:", err);

      setError(
        "We could not submit your borrowing request. Please check your internet connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // SUCCESS SCREEN
  // --------------------------------------------------

  if (submitted) {
    return (
      <main className="min-h-screen bg-violet-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* Back to Home */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 transition hover:text-violet-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={42} />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
              Borrowing Request Submitted
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Your asset borrowing request has been successfully
              submitted to Barangay Poblacion North.
            </p>

            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-5 text-left">
              <div className="flex gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-violet-600"
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    What happens next?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Barangay personnel will review your request,
                    verify the information provided, and process the
                    borrowing schedule. The barangay may contact you
                    using the contact information you provided.
                  </p>
                </div>
              </div>
            </div>

            {/* Central Notification Tracking */}
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-left">
              <div className="flex gap-3">
                <Bell
                  size={20}
                  className="mt-0.5 shrink-0 text-indigo-600"
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    Track Your Request
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You can track the progress of your equipment
                    borrowing request and future returning status
                    through the Notifications page.
                  </p>
                </div>
              </div>

              <Link
                href="/notifications"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Bell size={18} />
                Open Notifications
              </Link>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 rounded-xl border border-violet-200 bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // BORROWING FORM
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-violet-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 transition hover:text-violet-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <section className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-700 p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3">
              <Package size={28} />
            </div>

            <div>
             

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Asset Borrowing and Returning
              </h1>

             
            </div>
          </div>
        </section>

        {/* Resident Notice */}
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <h2 className="font-bold text-amber-900">
                Important Reminder
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                This service is intended for residents of Barangay
                Poblacion North. All borrowing requests are subject
                to review and approval by authorized barangay
                personnel.
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Borrower Information */}
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <UserRound size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Borrower Information
                </h2>

                <p className="text-sm text-slate-500">
                  Provide your basic information.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  name="borrowerName"
                  value={formData.borrowerName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Contact Number{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  name="borrowerContactNumber"
                  value={formData.borrowerContactNumber}
                  onChange={handleChange}
                  placeholder="09XXXXXXXXX"
                  pattern="09[0-9]{9}"
                  maxLength={11}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                   Purok{" "}
                  <span className="text-red-500">*</span>
                </label>

                 <ResidentLocationSelect id="assetPurok" value={formData.purok} onChange={(value) => setFormData((current) => ({ ...current, purok: value }))} />
                <div className="mt-3"><ResidentVerificationPanel status={verificationStatus} /></div>
              </div>
            </div>
          </section>

          {/* Asset Information */}
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Package size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Asset Information
                </h2>

                <p className="text-sm text-slate-500">
                  Select the barangay-owned asset you want to borrow.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Asset <span className="text-red-500">*</span>
                </label>

                <select
                  required
                  name="assetName"
                  value={formData.assetName}
                  onChange={(e) => {
                    const nextAsset = inventory.find(
                      (item) => item.name === e.target.value
                    );

                    setFormData((current) => ({
                      ...current,
                      assetName: e.target.value,
                      quantity: nextAsset
                        ? String(
                            Math.min(
                              Number(current.quantity) || 1,
                              nextAsset.availableQuantity
                            )
                          )
                        : "1",
                    }));
                  }}
                  disabled={inventoryLoading || inventory.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">
                    {inventoryLoading
                      ? "Loading assets..."
                      : inventory.length === 0
                        ? "No assets available"
                        : "Select an asset"}
                  </option>

                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.availableQuantity} {item.unit} available)
                    </option>
                  ))}
                </select>

                {inventoryError && (
                  <p className="mt-2 text-xs text-red-600">
                    {inventoryError}
                  </p>
                )}
               </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quantity <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max={selectedAsset?.availableQuantity ?? 1}
                  disabled={!selectedAsset}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />

                {selectedAsset && (
                  <p className="mt-2 text-xs text-slate-500">
                    {selectedAsset.availableQuantity} {selectedAsset.unit} currently available.
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Purpose <span className="text-red-500">*</span>
                </label>

                <textarea
                  required
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Explain why you need to borrow the asset..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CalendarDays size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Borrowing Schedule
                </h2>

                <p className="text-sm text-slate-500">
                  Select when you plan to borrow and return the
                  asset.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Borrow Date <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="date"
                  name="borrowDate"
                  value={formData.borrowDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Expected Return Date{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="date"
                  name="expectedReturnDate"
                  value={formData.expectedReturnDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
          </section>

          {/* Witness */}
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Users size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Witness / Checker
                </h2>

                <p className="text-sm text-slate-500">
                  The witness must be a different person from the
                  borrower.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Witness Full Name{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  name="witnessName"
                  value={formData.witnessName}
                  onChange={handleChange}
                  placeholder="Enter witness/checker name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Relationship to Borrower{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  name="witnessRelationship"
                  value={formData.witnessRelationship}
                  onChange={handleChange}
                  placeholder="e.g. Relative, Friend, Neighbor"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Witness Contact Number{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  name="witnessContactNumber"
                  value={formData.witnessContactNumber}
                  onChange={handleChange}
                  placeholder="09XXXXXXXXX"
                  pattern="09[0-9]{9}"
                  maxLength={11}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
          </section>

          {/* Responsibility */}
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
              <div className="flex gap-3">
                <ClipboardCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-violet-600"
                />

                <div>
                  <h3 className="font-bold text-slate-900">
                    Borrower Responsibilities
                  </h3>

                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    <li>
                      • Use the borrowed asset only for the stated
                      purpose.
                    </li>

                    <li>
                      • Keep the asset safe and in good condition.
                    </li>

                    <li>
                      • Return the asset on the agreed return date.
                    </li>

                    <li>
                      • Damage, loss, or late return may result in
                      applicable penalties according to barangay
                      policy.
                    </li>

                    <li>
                      • The witness/checker may be contacted if an
                      issue occurs involving the borrower or the
                      borrowed asset.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                required
                type="checkbox"
                name="penaltyAgreement"
                checked={formData.penaltyAgreement}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />

              <span className="text-sm leading-6 text-slate-700">
                I understand and agree to the responsibilities and
                that applicable penalties may be imposed for damage,
                loss, or late return of barangay-owned assets.
              </span>
            </label>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || verificationStatus !== "verified"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Submitting Request...
              </>
            ) : (
              <>
                <ShieldCheck size={19} />
                Submit Borrowing Request
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
