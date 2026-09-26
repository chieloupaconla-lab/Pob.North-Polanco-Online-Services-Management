"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Home,
  Loader2,
  Send,
} from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const documentTypes = [
  "Barangay Clearance",
  "Barangay Certificate",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Other Barangay Document",
];

type FormData = {
  fullName: string;
  purokStreet: string;
  documentType: string;
  purpose: string;
};

export default function DocumentsPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    purokStreet: "",
    documentType: "",
    purpose: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");

    if (
      !formData.fullName.trim() ||
      !formData.purokStreet.trim() ||
      !formData.documentType ||
      !formData.purpose.trim()
    ) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, "documents"), {
        fullName: formData.fullName.trim(),
        purokStreet: formData.purokStreet.trim(),
        documentType: formData.documentType,
        purpose: formData.purpose.trim(),

        status: "Pending",
        adminNotes: "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Document request submission error:", error);

      setErrorMessage(
        "We could not submit your request. Please check your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setFormData({
      fullName: "",
      purokStreet: "",
      documentType: "",
      purpose: "",
    });

    setSubmitted(false);
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
        {/* Header */}
        <header className="border-b border-violet-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-slate-800 transition hover:text-violet-700"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                <Home className="h-5 w-5 text-violet-700" />
              </div>

              <div>
                <p className="text-sm font-bold">
                  Barangay Poblacion North
                </p>
                <p className="text-xs text-slate-500">
                  Polanco, Zamboanga del Norte
                </p>
              </div>
            </Link>

            <Link
              href="/"
              className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-violet-700 sm:flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </header>

        {/* Success Content */}
        <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-12">
          <div className="w-full max-w-xl">
            <div className="rounded-3xl border border-violet-100 bg-white p-7 shadow-xl shadow-violet-100/50 sm:p-10">
              {/* Success Icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-11 w-11 text-green-600" />
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
                  Request Submitted
                </p>

                <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Your request was submitted successfully!
                </h1>

                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
                  Your document request has been sent to Barangay Poblacion
                  North for review.
                </p>
              </div>

              {/* Current Status */}
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <ClipboardCheck className="h-5 w-5 text-amber-700" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      Current Status
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-slate-900">
                      Pending
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      Your request is waiting for review by an authorized
                      barangay personnel.
                    </p>
                  </div>
                </div>
              </div>

              {/* Information */}
              <div className="mt-6 rounded-2xl bg-violet-50 p-5">
                <p className="text-sm font-bold text-slate-900">
                  Want to check your request later?
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  You can view the latest status of your request anytime using
                  the same information you provided in your request.
                </p>
              </div>

              {/* Buttons */}
              <div className="mt-7 space-y-3">
                <Link
                  href="/documents/status"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                >
                  <ClipboardCheck className="h-5 w-5" />
                  View Request Status
                </Link>

                <button
                  type="button"
                  onClick={handleSubmitAnother}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
                >
                  <FileText className="h-5 w-5" />
                  Submit Another Request
                </button>

                <Link
                  href="/"
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-700"
                >
                  <Home className="h-4 w-4" />
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-violet-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-slate-800 transition hover:text-violet-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Home className="h-5 w-5 text-violet-700" />
            </div>

            <div>
              <p className="text-sm font-bold">
                Barangay Poblacion North
              </p>
              <p className="text-xs text-slate-500">
                Polanco, Zamboanga del Norte
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-violet-700 sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main */}
      <section className="px-5 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          {/* Page Heading */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
              <FileText className="h-8 w-8 text-violet-700" />
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-wider text-violet-600">
              Online Document Request
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Request a Barangay Document
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Submit your document request online without creating an account.
              Your request will be reviewed by authorized personnel of
              Barangay Poblacion North.
            </p>
          </div>

          {/* Residency Notice */}
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                <Home className="h-5 w-5 text-amber-700" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  For Barangay Poblacion North Residents
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Please provide your correct Purok or Street. The information
                  you submit may be validated by authorized barangay personnel
                  before your document is processed or issued.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="mt-8 rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/40 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                />
              </div>

              {/* Purok / Street */}
              <div>
                <label
                  htmlFor="purokStreet"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Purok / Street <span className="text-red-500">*</span>
                </label>

                <input
                  id="purokStreet"
                  name="purokStreet"
                  type="text"
                  value={formData.purokStreet}
                  onChange={handleChange}
                  placeholder="Example: Purok 2, Poblacion North"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter your Purok or Street in Barangay Poblacion North.
                </p>
              </div>

              {/* Document Type */}
              <div>
                <label
                  htmlFor="documentType"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Document Type <span className="text-red-500">*</span>
                </label>

                <select
                  id="documentType"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                >
                  <option value="">Select a document</option>

                  {documentTypes.map((document) => (
                    <option key={document} value={document}>
                      {document}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label
                  htmlFor="purpose"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Purpose <span className="text-red-500">*</span>
                </label>

                <textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Enter the purpose of your document request"
                  required
                  disabled={isSubmitting}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                />
              </div>

              {/* Error */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Document Request
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                By submitting this form, you confirm that the information
                provided is accurate and may be validated by authorized
                barangay personnel.
              </p>
            </form>
          </div>

          {/* Status Link */}
          <div className="mt-6 rounded-2xl border border-violet-100 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">
              Already submitted a document request?
            </p>

            <Link
              href="/documents/status"
              className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-violet-700 transition hover:text-violet-900"
            >
              <ClipboardCheck className="h-4 w-4" />
              Check My Request Status
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}