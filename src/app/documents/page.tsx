
"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  FileText,
  Home,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { ResidentLocationSelect, ResidentVerificationPanel, useResidentVerification } from "@/components/resident/ResidentVerification";
import { isOfficialPurok } from "@/lib/purokConfig";
import { DOCUMENT_TYPES, isCurrentDocumentType } from "@/config/documentTypes";

type FormData = {
  fullName: string;
  email: string;
  purok: string;
  documentType: string;
  purpose: string;
};

export default function DocumentsPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    purok: "",
    documentType: "",
    purpose: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submissionIdRef = useRef(crypto.randomUUID().replace(/-/g, ""));
  const verificationStatus = useResidentVerification(formData.fullName, formData.purok);

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

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage("");

    const cleanFullName = formData.fullName.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPurok = formData.purok.trim();
    const cleanDocumentType =
      formData.documentType.trim();
    const cleanPurpose = formData.purpose.trim();

    if (
      !cleanFullName ||
      !cleanEmail ||
      !cleanPurok ||
      !cleanDocumentType ||
      !cleanPurpose
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );
      return;
    }

    if (!isCurrentDocumentType(cleanDocumentType)) {
      setErrorMessage("Please select an approved document type.");
      return;
    }

    if (!isOfficialPurok(cleanPurok)) {
      setErrorMessage("Please select an official Purok.");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setErrorMessage(
        "Please enter a valid Gmail or email address."
      );
      return;
    }

    if (verificationStatus !== "verified") {
      setErrorMessage("Please verify your resident information before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionIdRef.current,
          fullName: cleanFullName,
          email: cleanEmail,
          purok: cleanPurok,
          documentType: cleanDocumentType,
          purpose: cleanPurpose,
        }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Document request submission failed.");

      setSubmitted(true);
    } catch (error) {
      console.error(
        "Document request submission error:",
        error
      );

      setErrorMessage(error instanceof TypeError ? "We could not reach the request service. Please check your connection and try again." : error instanceof Error ? error.message : "We could not submit your request. Please check your internet connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setFormData({
      fullName: "",
      email: "",
       purok: "",
      documentType: "",
      purpose: "",
    });

    setSubmitted(false);
    setErrorMessage("");
    submissionIdRef.current = crypto.randomUUID().replace(/-/g, "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * ============================================================
   * SUCCESS PAGE
   * ============================================================
   */

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-purple-700 transition hover:text-purple-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-purple-100">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-8 text-white sm:px-8">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/15 p-3">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-purple-200">
                    Document Service
                  </p>

                  <h1 className="mt-1 text-2xl font-bold">
                    Request Submitted
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-purple-100">
                    Your barangay document request has
                    been successfully submitted.
                  </p>
                </div>
              </div>
            </div>

            {/* Success Content */}
            <div className="p-6 sm:p-8">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                  <div>
                    <h2 className="font-semibold text-green-900">
                      Your request is now pending review.
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-green-800">
                      Barangay personnel will review your
                      request. Please make sure the
                      information you submitted is correct.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Notification */}
              <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />

                  <div>
                    <h2 className="font-semibold text-purple-900">
                      Email notifications enabled
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-purple-800">
                      Status updates for your request will
                      be sent to:
                    </p>

                    <p className="mt-1 font-semibold text-purple-900 break-all">
                      {formData.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Reminder */}
              <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />

                  <div>
                    <h2 className="font-semibold text-indigo-900">
                      Track your request
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-indigo-800">
                      You can view the status of your
                      document request anytime through the
                      Notifications page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/notifications"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                >
                  <Bell className="h-4 w-4" />
                  View Notifications
                </Link>

                <button
                  type="button"
                  onClick={handleSubmitAnother}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  <FileText className="h-4 w-4" />
                  Submit Another Request
                </button>
              </div>

              {/* Home */}
              <div className="mt-6 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-purple-700"
                >
                  <Home className="h-4 w-4" />
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * MAIN PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-purple-700 transition hover:text-purple-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-purple-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-8 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/15 p-3">
                <FileText className="h-7 w-7" />
              </div>

              <div>
                

                <h1 className="mt-1 text-2xl font-bold">
                  Document Request
                </h1>

                
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {/* Residency Notice */}
            <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />

                <div>
                  <h2 className="font-semibold text-purple-900">
                    For Poblacion North Residents
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-purple-800">
                    This online service is intended only
                    for residents of Barangay Poblacion
                    North. Your submitted information may
                    be validated by authorized barangay
                    personnel.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  {errorMessage}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Full Name{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your complete name"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

             

              {/* Purok */}
              <div>
                <label
                  htmlFor="purok"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Purok{" "}
                  <span className="text-red-500">*</span>
                </label>

                <ResidentLocationSelect id="purok" value={formData.purok} onChange={(value) => setFormData((previous) => ({ ...previous, purok: value }))} />

                <ResidentVerificationPanel status={verificationStatus} />

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Please enter your location within
                  Barangay Poblacion North. This information
                  may be checked during validation.
                </p>
              </div>

              {/* Document Type */}
              <div>
                <label
                  htmlFor="documentType"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Document Type{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  id="documentType"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    Select a document
                  </option>

                  {DOCUMENT_TYPES.map((document) => (
                    <option
                      key={document}
                      value={document}
                    >
                      {document}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label
                  htmlFor="purpose"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Purpose{" "}
                  <span className="text-red-500">*</span>
                </label>

                <textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Explain why you need this document"
                  rows={4}
                  required
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* Information Notice */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs leading-5 text-gray-600">
                  <span className="font-semibold text-gray-800">
                    Important:
                  </span>{" "}
                  Submitting this form does not
                  automatically mean that your request is
                  approved. Your request will first be
                  reviewed and validated by authorized
                  barangay personnel.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || verificationStatus !== "verified"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-purple-800 hover:to-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Document Request
                  </>
                )}
              </button>
            </form>

            {/* Notification Reminder */}
            <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />

                <div>
                  <p className="text-sm font-semibold text-purple-900">
                    Track your request through
                    Notifications
                  </p>

                  <p className="mt-1 text-xs leading-5 text-purple-800">
                    After submitting, you can use the
                    Notifications page to view the current
                    status of your document request.
                  </p>

                  <Link
                    href="/notifications"
                    className="mt-2 inline-flex text-xs font-semibold text-purple-700 underline underline-offset-2 hover:text-purple-900"
                  >
                    Go to Notifications
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
