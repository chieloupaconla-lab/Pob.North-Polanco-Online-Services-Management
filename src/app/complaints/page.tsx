"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  MapPin,
  Send,
  ShieldCheck,
  User,
  Home,
  Image as ImageIcon,
} from "lucide-react";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

type SubmissionType = "Anonymous" | "Provide My Name";

type FormDataType = {
  submissionType: SubmissionType;
  fullName: string;
  purokStreet: string;
  category: string;
  description: string;
  locationOfConcern: string;
  incidentDate: string;
};

const categories = [
  "Community Concern",
  "Damaged Public Facility",
  "Road or Drainage Problem",
  "Streetlight Problem",
  "Public Safety Concern",
  "Other",
];

function generateComplaintTrackingCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "CN-";

  for (let i = 0; i < 8; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return result;
}

/*
 * ============================================================
 * FAST IMAGE COMPRESSION
 * ============================================================
 */

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        const QUALITY = 0.6;

        let width = image.width;
        let height = image.height;

        if (
          width > MAX_WIDTH ||
          height > MAX_HEIGHT
        ) {
          const widthRatio =
            MAX_WIDTH / width;

          const heightRatio =
            MAX_HEIGHT / height;

          const ratio = Math.min(
            widthRatio,
            heightRatio
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext("2d");

        if (!context) {
          reject(
            new Error(
              "Could not process the selected image."
            )
          );
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "Could not compress the selected image."
                )
              );
              return;
            }

            const compressedFile =
              new File(
                [blob],
                `complaint-${Date.now()}.jpg`,
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              );

            resolve(compressedFile);
          },
          "image/jpeg",
          QUALITY
        );
      };

      image.onerror = () => {
        reject(
          new Error(
            "The selected image could not be processed."
          )
        );
      };

      image.src =
        event.target?.result as string;
    };

    reader.onerror = () => {
      reject(
        new Error(
          "The selected image could not be read."
        )
      );
    };

    reader.readAsDataURL(file);
  });
}

export default function ComplaintsPage() {
  const [formData, setFormData] =
    useState<FormDataType>({
      submissionType: "Provide My Name",
      fullName: "",
      purokStreet: "",
      category: "Community Concern",
      description: "",
      locationOfConcern: "",
      incidentDate: "",
    });

  const [evidenceFile, setEvidenceFile] =
    useState<File | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [submittedTrackingCode, setSubmittedTrackingCode] =
    useState("");

  const [imageSize, setImageSize] =
    useState("");

  const handleChange = (
    field: keyof FormDataType,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /*
   * ============================================================
   * IMAGE SELECTION
   * ============================================================
   */

  const handleEvidenceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] || null;

    setErrorMessage("");
    setImageSize("");

    if (!file) {
      setEvidenceFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );

      event.target.value = "";
      setEvidenceFile(null);
      return;
    }

    const MAX_ORIGINAL_SIZE =
      15 * 1024 * 1024;

    if (file.size > MAX_ORIGINAL_SIZE) {
      setErrorMessage(
        "The selected image is too large. Please choose an image smaller than 15 MB."
      );

      event.target.value = "";
      setEvidenceFile(null);
      return;
    }

    setEvidenceFile(file);

    const sizeInMB =
      file.size / (1024 * 1024);

    setImageSize(
      `${sizeInMB.toFixed(2)} MB selected`
    );
  };

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    const cleanName =
      formData.fullName.trim();

    const cleanPurokStreet =
      formData.purokStreet.trim();

    const cleanDescription =
      formData.description.trim();

    const cleanLocation =
      formData.locationOfConcern.trim();

    /*
     * VALIDATION
     */

    if (
      formData.submissionType ===
      "Provide My Name"
    ) {
      if (!cleanName) {
        setErrorMessage(
          "Please enter your full name."
        );
        return;
      }

      if (!cleanPurokStreet) {
        setErrorMessage(
          "Please enter your purok or street."
        );
        return;
      }
    }

    if (!cleanDescription) {
      setErrorMessage(
        "Please describe the concern."
      );
      return;
    }

    if (!cleanLocation) {
      setErrorMessage(
        "Please enter the location of the concern."
      );
      return;
    }

    /*
     * START SUBMISSION
     */

    try {
      setSubmitting(true);

      const trackingCode =
        formData.submissionType ===
        "Anonymous"
          ? generateComplaintTrackingCode()
          : "";

      /*
       * SAVE COMPLAINT FIRST
       */

      const complaintRef = await addDoc(
        collection(db, "complaints"),
        {
          submissionType:
            formData.submissionType,

          fullName:
            formData.submissionType ===
            "Anonymous"
              ? ""
              : cleanName,

          purokStreet:
            formData.submissionType ===
            "Anonymous"
              ? ""
              : cleanPurokStreet,

          category:
            formData.category,

          description:
            cleanDescription,

          locationOfConcern:
            cleanLocation,

          incidentDate:
            formData.incidentDate,

          evidenceUrl: "",

          status: "Pending",

          trackingCode,

          adminNotes: "",

          assignedTo: "",

          evidenceUploadStatus:
            evidenceFile
              ? "Uploading"
              : "No Photo",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          resolvedAt: null,
        }
      );

      /*
       * COMPLAINT IS NOW SAVED
       */

      setSubmittedTrackingCode(
        trackingCode
      );

      setSubmitted(true);

      setFormData({
        submissionType:
          "Provide My Name",
        fullName: "",
        purokStreet: "",
        category:
          "Community Concern",
        description: "",
        locationOfConcern: "",
        incidentDate: "",
      });

      setEvidenceFile(null);
      setImageSize("");

      /*
       * PHOTO UPLOAD
       */

      if (evidenceFile) {
        setUploadingImage(true);

        try {
          const compressedFile =
            await compressImage(
              evidenceFile
            );

          const MAX_COMPRESSED_SIZE =
            1 * 1024 * 1024;

          if (
            compressedFile.size >
            MAX_COMPRESSED_SIZE
          ) {
            await updateDoc(
              doc(
                db,
                "complaints",
                complaintRef.id
              ),
              {
                evidenceUploadStatus:
                  "Failed - Image Too Large",

                updatedAt:
                  serverTimestamp(),
              }
            );

            setUploadingImage(false);
            return;
          }

          const storageRef = ref(
            storage,
            `complaint-evidence/${complaintRef.id}.jpg`
          );

          await uploadBytes(
            storageRef,
            compressedFile,
            {
              contentType: "image/jpeg",
            }
          );

          const evidenceUrl =
            await getDownloadURL(
              storageRef
            );

          await updateDoc(
            doc(
              db,
              "complaints",
              complaintRef.id
            ),
            {
              evidenceUrl,

              evidenceUploadStatus:
                "Uploaded",

              updatedAt:
                serverTimestamp(),
            }
          );
        } catch (imageError) {
          console.error(
            "Background image upload error:",
            imageError
          );

          try {
            await updateDoc(
              doc(
                db,
                "complaints",
                complaintRef.id
              ),
              {
                evidenceUploadStatus:
                  "Failed",

                updatedAt:
                  serverTimestamp(),
              }
            );
          } catch (updateError) {
            console.error(
              "Could not update image status:",
              updateError
            );
          }
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error(
        "Complaint submission error:",
        error
      );

      setErrorMessage(
        "Something went wrong while submitting your concern. Please try again."
      );

      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  /*
   * ============================================================
   * SUCCESS SCREEN
   * ============================================================
   */

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">

          {/* Back Button */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-purple-700 transition hover:text-purple-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-purple-100 sm:p-10">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <p className="text-sm font-bold uppercase tracking-wider text-purple-600">
              Submission Successful
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Concern Submitted Successfully
            </h1>

            <p className="mt-3 text-gray-600">
              Thank you for submitting your
              community concern. The barangay
              personnel will review your
              submission.
            </p>

            {/* Anonymous Tracking Code */}
            {submittedTrackingCode && (
              <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <ShieldCheck className="h-6 w-6 text-purple-700" />
                </div>

                <p className="mt-4 text-sm font-bold text-purple-700">
                  Your Private Tracking Code
                </p>

                <p className="mt-2 text-2xl font-bold tracking-wider text-purple-900">
                  {submittedTrackingCode}
                </p>

                <p className="mt-3 text-xs leading-5 text-purple-700">
                  Save this code somewhere safe.
                  Because your complaint was
                  submitted anonymously, this code
                  is required to find your complaint
                  on the Notifications page.
                </p>

              </div>
            )}

            {/* Photo Upload Information */}
            {evidenceFile && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Photo evidence is uploading
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      Your complaint has already
                      been submitted. The photo is
                      being uploaded separately and
                      will be attached to your
                      complaint when finished.
                    </p>

                    {uploadingImage && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-700">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                        Uploading photo...
                      </div>
                    )}

                  </div>

                </div>

              </div>
            )}

            {/* Central Notification Tracking */}
            <div className="mt-7 rounded-2xl border border-purple-200 bg-purple-50 p-5 text-left">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                  <Bell className="h-5 w-5 text-purple-700" />
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Track your request through Notifications
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    You do not need to check this
                    complaint page again. Open the
                    notification bell to view the
                    current progress of your concern
                    together with your other barangay
                    requests.
                  </p>

                  {submittedTrackingCode ? (
                    <p className="mt-3 text-xs font-medium text-purple-700">
                      Anonymous complaint:
                      use your private tracking code
                      on the Notifications page.
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-medium text-purple-700">
                      Named complaint:
                      use the same Full Name and
                      Purok/Street you submitted.
                    </p>
                  )}
                </div>

              </div>

            </div>

            {/* Buttons */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <Link
                href="/notifications"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
              >
                <Bell className="h-5 w-5" />
                Open Notifications
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Home className="h-5 w-5" />
                Back to Home
              </Link>

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
                <AlertTriangle className="h-7 w-7" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-purple-200">
                  Community Service
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  Community Concern
                </h1>

                <p className="mt-2 text-sm leading-6 text-purple-100">
                  Report damaged public facilities,
                  road or drainage problems,
                  streetlight issues, and other
                  community concerns in Barangay
                  Poblacion North.
                </p>
              </div>

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-7 p-6 sm:p-8"
          >

            {/* Submission Type */}
            <div>

              <h2 className="text-lg font-bold text-gray-900">
                Submission Type
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose whether you want to provide
                your identity.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "submissionType",
                      "Provide My Name"
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    formData.submissionType ===
                    "Provide My Name"
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    <User className="h-5 w-5 text-purple-600" />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Provide My Name
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Your name and location will
                        be recorded.
                      </p>
                    </div>

                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "submissionType",
                      "Anonymous"
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    formData.submissionType ===
                    "Anonymous"
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    <ShieldCheck className="h-5 w-5 text-purple-600" />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Anonymous
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Your name and address are
                        not recorded.
                      </p>
                    </div>

                  </div>
                </button>

              </div>

            </div>

            {/* Name + Purok */}
            {formData.submissionType ===
              "Provide My Name" && (
              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Full Name{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
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
                    disabled={submitting}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Purok / Street{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={formData.purokStreet}
                    onChange={(event) =>
                      handleChange(
                        "purokStreet",
                        event.target.value
                      )
                    }
                    placeholder="Example: Purok 2"
                    required
                    disabled={submitting}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    This is used only to help locate
                    your request through Notifications.
                  </p>
                </div>

              </div>
            )}

            {/* Category */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category
              </label>

              <select
                value={formData.category}
                onChange={(event) =>
                  handleChange(
                    "category",
                    event.target.value
                  )
                }
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>

            </div>

            {/* Description */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description of Concern{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <textarea
                value={formData.description}
                onChange={(event) =>
                  handleChange(
                    "description",
                    event.target.value
                  )
                }
                rows={5}
                required
                disabled={submitting}
                placeholder="Describe the concern or problem..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
              />

            </div>

            {/* Location */}
            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="h-4 w-4 text-purple-600" />

                Exact Location of Concern{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={formData.locationOfConcern}
                onChange={(event) =>
                  handleChange(
                    "locationOfConcern",
                    event.target.value
                  )
                }
                placeholder="Example: Near Barangay Hall, Purok 2"
                required
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
              />

            </div>

            {/* Incident Date */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Incident Date
              </label>

              <input
                type="date"
                value={formData.incidentDate}
                onChange={(event) =>
                  handleChange(
                    "incidentDate",
                    event.target.value
                  )
                }
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
              />

            </div>

            {/* Evidence */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Evidence / Photo
              </label>

              <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                  </div>

                  <div className="flex-1">

                    <input
                      type="file"
                      accept="image/*"
                      disabled={submitting}
                      onChange={
                        handleEvidenceChange
                      }
                      className="block w-full text-sm"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Optional. Upload a photo showing
                      the reported concern.
                    </p>

                    <p className="mt-1 text-xs text-purple-600">
                      Photos are automatically
                      reduced to a smaller JPEG for
                      faster upload.
                    </p>

                    {imageSize && (
                      <p className="mt-2 text-xs font-medium text-gray-600">
                        {imageSize}
                      </p>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* Privacy */}
            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">

              {formData.submissionType ===
              "Anonymous" ? (
                <div className="flex gap-3">

                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

                  <p>
                    Your identity will not be
                    recorded. After submission, you
                    will receive a private tracking
                    code. Keep the code safe because
                    it will be used to find your
                    anonymous concern through the
                    Notifications page.
                  </p>

                </div>
              ) : (
                <div className="flex gap-3">

                  <User className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

                  <p>
                    Your name and Purok/Street are
                    used to help you find this
                    submission later through the
                    central Notifications page,
                    together with your other barangay
                    requests.
                  </p>

                </div>
              )}

            </div>

            {/* Error */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                  Submitting Concern...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Community Concern
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              By submitting this form, you confirm
              that the information provided is
              accurate. Submitted concerns may be
              reviewed and validated by authorized
              barangay personnel.
            </p>

          </form>
        </div>

        {/* Notification Reminder */}
        <div className="mt-6 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
              <Bell className="h-5 w-5 text-purple-700" />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-900">
                Track all your requests in one place
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                After submitting a concern, you do not
                need to return to this page to check its
                progress. Open the notification bell to
                view your complaint together with your
                document and equipment requests.
              </p>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}