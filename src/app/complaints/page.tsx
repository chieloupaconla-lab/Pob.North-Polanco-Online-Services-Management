"use client";

import { FormEvent, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileImage,
  ImagePlus,
  Loader2,
  MapPin,
  MessageSquareWarning,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import Link from "next/link";

type SubmissionType = "Anonymous" | "Named";

interface ComplaintForm {
  submissionType: SubmissionType;
  fullName: string;
  description: string;
  locationOfConcern: string;
  incidentDate: string;
}

export default function ComplaintsPage() {
  const [formData, setFormData] = useState<ComplaintForm>({
    submissionType: "Anonymous",
    fullName: "",
    description: "",
    locationOfConcern: "",
    incidentDate: "",
  });

  const [evidenceFile, setEvidenceFile] = useState<File | null>(
    null
  );

  const [previewUrl, setPreviewUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    field: keyof ComplaintForm,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrorMessage("");
  };

  const handleSubmissionTypeChange = (
    type: SubmissionType
  ) => {
    setFormData((previous) => ({
      ...previous,
      submissionType: type,
      fullName:
        type === "Anonymous" ? "" : previous.fullName,
    }));

    setErrorMessage("");
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Please upload only JPG, JPEG, PNG, or WEBP image files."
      );

      event.target.value = "";
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "The image must not be larger than 5 MB."
      );

      event.target.value = "";
      return;
    }

    // Remove previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setEvidenceFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage("");
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setEvidenceFile(null);
    setPreviewUrl("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    /*
     * Basic validation
     */
    if (!formData.description.trim()) {
      setErrorMessage(
        "Please enter your complaint or concern."
      );
      return;
    }

    if (
      formData.submissionType === "Named" &&
      !formData.fullName.trim()
    ) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    try {
      setIsSubmitting(true);

      /*
       * IMPORTANT:
       * Save the complaint to Firestore FIRST.
       *
       * This means the complaint is recorded immediately
       * instead of waiting for the photo upload.
       */
      const complaintRef = await addDoc(
        collection(db, "complaints"),
        {
          submissionType: formData.submissionType,

          fullName:
            formData.submissionType === "Named"
              ? formData.fullName.trim()
              : "",

          category: "Community Concern",

          description: formData.description.trim(),

          locationOfConcern:
            formData.locationOfConcern.trim(),

          incidentDate: formData.incidentDate || "",

          /*
           * Empty initially.
           * It will be updated after the photo uploads.
           */
          evidenceUrl: "",

          status: "Pending",

          adminNotes: "",

          assignedTo: "",

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp(),

          resolvedAt: null,
        }
      );

      /*
       * Show success immediately after Firestore
       * successfully receives the complaint.
       *
       * The resident does not have to wait for the
       * evidence upload.
       */
      setIsSubmitted(true);

      /*
       * Save the current file before clearing the form.
       */
      const fileToUpload = evidenceFile;

      setFormData({
        submissionType: "Anonymous",
        fullName: "",
        description: "",
        locationOfConcern: "",
        incidentDate: "",
      });

      setEvidenceFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");

      /*
       * Upload evidence AFTER the complaint has already
       * been successfully submitted.
       *
       * This happens in the background from the resident's
       * point of view.
       */
      if (fileToUpload) {
        void uploadComplaintEvidence(
          complaintRef.id,
          fileToUpload
        );
      }
    } catch (error) {
      console.error(
        "Complaint submission error:",
        error
      );

      setErrorMessage(
        "We could not submit your complaint. Please check your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * Upload supporting evidence after the complaint
   * has already been saved.
   */
  const uploadComplaintEvidence = async (
    complaintId: string,
    file: File
  ) => {
    try {
      const safeFileName = file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      );

      const fileName = `${Date.now()}-${safeFileName}`;

      const storageReference = ref(
        storage,
        `complaint-evidence/${complaintId}-${fileName}`
      );

      await uploadBytes(
        storageReference,
        file
      );

      const evidenceUrl = await getDownloadURL(
        storageReference
      );

      /*
       * Update the already-created complaint with
       * the evidence URL.
       */
      await updateDoc(
        doc(db, "complaints", complaintId),
        {
          evidenceUrl,
          updatedAt: serverTimestamp(),
        }
      );

      console.log(
        "Complaint evidence uploaded successfully."
      );
    } catch (error) {
      /*
       * The complaint is already saved.
       *
       * If the image upload fails, the complaint remains
       * available to the admin. The evidenceUrl simply
       * stays empty.
       */
      console.error(
        "Evidence upload failed:",
        error
      );
    }
  };

  /*
   * Success screen
   */
  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
          <div className="w-full rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-xl shadow-violet-100/50 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2
                size={42}
                className="text-green-600"
              />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              Complaint Submitted Successfully
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Thank you for reporting your concern. Your
              submission has been received by Barangay
              Poblacion North and will be reviewed by
              authorized barangay personnel.
            </p>

            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-violet-100 bg-violet-50 p-5 text-left">
              <div className="flex gap-3">
                <ShieldCheck
                  size={22}
                  className="mt-0.5 shrink-0 text-violet-600"
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    What happens next?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The barangay personnel will review your
                    complaint and take appropriate action
                    when necessary.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Submit Another Complaint
              </button>

              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-violet-600"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
            <MessageSquareWarning
              size={28}
              className="text-violet-600"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Community Concerns
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Report a community concern or problem that needs
            the attention of Barangay Poblacion North.
          </p>
        </div>

        {/* Residency Notice */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <h2 className="font-semibold text-amber-900">
                For Poblacion North Residents
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                This service is intended for residents of
                Barangay Poblacion North. Submitted information
                may be validated by authorized barangay
                personnel before action is taken.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-violet-100/40 sm:p-8"
        >
          {/* Submission Type */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                How would you like to submit?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                You may submit anonymously or provide your
                name.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Anonymous */}
              <button
                type="button"
                onClick={() =>
                  handleSubmissionTypeChange("Anonymous")
                }
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  formData.submissionType === "Anonymous"
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-200 bg-white hover:border-violet-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      formData.submissionType ===
                      "Anonymous"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <ShieldCheck size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Anonymous
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Do not provide your name, phone number,
                      or email.
                    </p>
                  </div>
                </div>
              </button>

              {/* Named */}
              <button
                type="button"
                onClick={() =>
                  handleSubmissionTypeChange("Named")
                }
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  formData.submissionType === "Named"
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-200 bg-white hover:border-violet-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      formData.submissionType === "Named"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <UserRound size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Provide My Name
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Your name will only be visible to
                      authorized barangay personnel.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <div className="my-8 border-t border-slate-100" />

          {/* Named User */}
          {formData.submissionType === "Named" && (
            <section className="mb-8">
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Full Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(event) =>
                  handleChange(
                    "fullName",
                    event.target.value
                  )
                }
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Your name is only accessible to authorized
                barangay personnel.
              </p>
            </section>
          )}

          {/* Complaint Details */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Complaint Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Provide the details of the community concern.
              </p>
            </div>

            {/* Category */}
            <div className="mb-6">
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Category
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <MessageSquareWarning
                  size={19}
                  className="text-violet-600"
                />

                <input
                  id="category"
                  type="text"
                  value="Community Concern"
                  readOnly
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Complaint / Concern Description{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  handleChange(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe the problem or concern clearly..."
                required
                rows={6}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Please provide enough information for the
                barangay personnel to understand the concern.
              </p>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label
                htmlFor="locationOfConcern"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Location of Concern
                <span className="ml-1 font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  id="locationOfConcern"
                  type="text"
                  value={formData.locationOfConcern}
                  onChange={(event) =>
                    handleChange(
                      "locationOfConcern",
                      event.target.value
                    )
                  }
                  placeholder="Example: Purok 2, near the barangay hall"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            {/* Incident Date */}
            <div className="mb-6">
              <label
                htmlFor="incidentDate"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Date of Incident
                <span className="ml-1 font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <input
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(event) =>
                  handleChange(
                    "incidentDate",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:max-w-md"
              />
            </div>

            {/* Evidence */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Supporting Photo / Evidence
                <span className="ml-1 font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              {!evidenceFile ? (
                <label
                  htmlFor="evidence"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-violet-300 hover:bg-violet-50/50"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                    <ImagePlus
                      size={27}
                      className="text-violet-600"
                    />
                  </div>

                  <p className="mt-4 font-semibold text-slate-800">
                    Upload a supporting image
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    JPG, JPEG, PNG, or WEBP • Maximum 5 MB
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-600 shadow-sm">
                    <Upload size={16} />
                    Choose Image
                  </div>

                  <input
                    id="evidence"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Evidence preview"
                        className="h-32 w-full rounded-xl object-cover sm:h-24 sm:w-32"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileImage
                          size={18}
                          className="shrink-0 text-violet-600"
                        />

                        <p className="truncate text-sm font-semibold text-slate-800">
                          {evidenceFile.name}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {(
                          evidenceFile.size /
                          (1024 * 1024)
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Privacy */}
          <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50 p-5">
            <div className="flex gap-3">
              <ShieldCheck
                size={22}
                className="mt-0.5 shrink-0 text-violet-600"
              />

              <div>
                <h3 className="font-semibold text-slate-900">
                  Privacy and Submission Notice
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Anonymous submissions do not require your
                  name, phone number, or email. If you provide
                  your name, it will only be visible to
                  authorized barangay personnel for purposes
                  related to processing your concern.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm leading-6 text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquareWarning size={18} />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>

        {/* Bottom Notice */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Important
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Please submit only legitimate community
                concerns. Providing accurate information helps
                barangay personnel properly evaluate and
                respond to the issue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}