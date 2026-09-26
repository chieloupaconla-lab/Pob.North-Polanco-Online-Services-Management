"use client";

import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Package,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { db } from "@/lib/firebase";

const assetOptions = [
  "Chairs",
  "Tables",
  "Tents",
  "Sound System",
  "Other Barangay-Owned Asset",
];

export default function AssetsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerContactNumber: "",
    purokStreet: "",
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

    if (formData.borrowDate > formData.expectedReturnDate) {
      setError(
        "The expected return date cannot be earlier than the borrow date."
      );
      return;
    }

    if (!formData.penaltyAgreement) {
      setError(
        "Please agree to the responsibility and penalty conditions before submitting."
      );
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "assets"), {
        borrowerName: formData.borrowerName.trim(),
        borrowerContactNumber:
          formData.borrowerContactNumber.trim(),
        purokStreet: formData.purokStreet.trim(),

        assetName: formData.assetName,
        quantity: Number(formData.quantity),

        purpose: formData.purpose.trim(),

        borrowDate: formData.borrowDate,
        expectedReturnDate: formData.expectedReturnDate,

        actualReturnDate: null,

        witnessName: formData.witnessName.trim(),
        witnessRelationship:
          formData.witnessRelationship.trim(),
        witnessContactNumber:
          formData.witnessContactNumber.trim(),

        status: "Pending",

        returnCondition: "",
        damageDetails: "",
        lossDetails: "",
        penalty: "",

        adminNotes: "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);

      setFormData({
        borrowerName: "",
        borrowerContactNumber: "",
        purokStreet: "",
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

  if (submitted) {
    return (
      <main className="min-h-screen bg-violet-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
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

            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-violet-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <section className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-700 p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3">
              <Package size={28} />
            </div>

            <div>
              <p className="text-sm font-semibold text-violet-100">
                Barangay Poblacion North
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Asset Borrowing and Returning
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Submit a request to borrow barangay-owned equipment
                and provide the required witness or checker
                information.
              </p>
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

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
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
                  Purok / Street{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  name="purokStreet"
                  value={formData.purokStreet}
                  onChange={handleChange}
                  placeholder="Enter your purok or street"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
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
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">Select an asset</option>

                  {assetOptions.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
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
                  max="1000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
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
            disabled={submitting}
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