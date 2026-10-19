"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Copy,
  Home,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/activityLog";
import { createAdminNotification } from "@/lib/notifications";
import { ResidentLocationSelect, ResidentVerificationPanel, useResidentVerification } from "@/components/resident/ResidentVerification";
import { isOfficialPurok } from "@/lib/purokConfig";
import {
  COMPLAINT_CATEGORIES,
  isOfficialComplaintCategory,
  type OfficialComplaintCategory,
} from "@/config/complaintCategories";

import {
  generateCancellationToken,
  hashCancellationToken,
} from "@/lib/cancellationToken";

type SubmissionType = "Anonymous" | "Provide My Name";

type FormDataType = {
  submissionType: SubmissionType;
  fullName: string;
  purok: string;
  category: OfficialComplaintCategory;
  description: string;
  locationOfConcern: string;
  incidentDate: string;
};

function getCategoryDescription(category: OfficialComplaintCategory) {
  return COMPLAINT_CATEGORIES.find((item) => item.name === category)?.description ?? "";
}

async function generateComplaintTrackingCode() {
  const response = await fetch("/api/complaints/tracking-code", { method: "POST" });
  const result = (await response.json()) as { trackingCode?: string };
  if (!response.ok || !result.trackingCode) throw new Error("Unable to create a tracking code. Please try again.");
  return result.trackingCode;
}

async function updateComplaintEvidence(
  complaintId: string,
  uploadToken: string,
  update: {
    evidenceUploadStatus: "Uploaded" | "Failed";
    evidenceUrl?: string;
    evidenceFileSize?: number;
  },
) {
  const response = await fetch("/api/complaints/evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ complaintId, uploadToken, ...update }),
  });
  const result = await response.json() as { message?: string };

  if (!response.ok) {
    throw new Error(result.message || "Unable to update complaint evidence.");
  }
}

/*
 * Compress the image before uploading.
 *
 * Maximum dimensions:
 * 800 x 800
 *
 * JPEG quality:
 * 50%
 *
 * This greatly reduces the size of photos
 * taken by phones.
 */
async function compressImage(
  file: File
): Promise<File> {
  return new Promise(
    (resolve, reject) => {
      const image = new Image();

      const objectUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        const QUALITY = 0.5;

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

          width = Math.round(
            width * ratio
          );

          height = Math.round(
            height * ratio
          );
        }

        const canvas =
          document.createElement(
            "canvas"
          );

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

        /*
         * White background prevents transparent
         * PNG/WebP images from becoming black
         * when converted to JPEG.
         */
        context.fillStyle = "#ffffff";

        context.fillRect(
          0,
          0,
          width,
          height
        );

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
                  lastModified:
                    Date.now(),
                }
              );

            resolve(
              compressedFile
            );
          },
          "image/jpeg",
          QUALITY
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            "The selected image could not be processed."
          )
        );
      };

      image.src = objectUrl;
    }
  );
}

export default function ComplaintsPage() {
  const [formData, setFormData] =
    useState<FormDataType>({
      submissionType:
        "Provide My Name",

      fullName: "",


      purok: "",

      category: "Peace and Order",

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

  const [compressingImage, setCompressingImage] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);
  const verificationStatus = useResidentVerification(formData.fullName, formData.purok);

  const [
    submittedTrackingCode,
    setSubmittedTrackingCode,
  ] = useState("");
  const [trackingCodeCopied, setTrackingCodeCopied] = useState(false);

  const [
    submittedCancellationToken,
    setSubmittedCancellationToken,
  ] = useState("");
  const [cancellationTokenCopied, setCancellationTokenCopied] = useState(false);

  const [imageSize, setImageSize] =
    useState("");

  const [
    compressedImageSize,
    setCompressedImageSize,
  ] = useState("");

  const handleChange = (
    field: keyof FormDataType,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    if (!isOfficialComplaintCategory(value)) return;
    setFormData((previous) => ({
      ...previous,
      category: value,
    }));
  };

  /*
   * Handle selected evidence photo.
   */
  const handleEvidenceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ||
      null;

    setErrorMessage("");

    setImageSize("");

    setCompressedImageSize("");

    setUploadProgress(0);

    if (!file) {
      setEvidenceFile(null);
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setErrorMessage(
        "Please select a valid image file."
      );

      event.target.value = "";

      setEvidenceFile(null);

      return;
    }

    /*
     * Original file limit:
     * 15 MB
     */
    const MAX_ORIGINAL_SIZE =
      15 * 1024 * 1024;

    if (
      file.size >
      MAX_ORIGINAL_SIZE
    ) {
      setErrorMessage(
        "The selected image is too large. Please choose an image smaller than 15 MB."
      );

      event.target.value = "";

      setEvidenceFile(null);

      return;
    }

    setEvidenceFile(file);

    const sizeInMB =
      file.size /
      (1024 * 1024);

    setImageSize(
      `${sizeInMB.toFixed(
        2
      )} MB selected`
    );
  };

  /*
   * Upload complaint evidence to Cloudinary,
   * then persist the returned URL in Firestore.
   */
  const uploadComplaintEvidence = async (
    complaintId: string,
    file: File,
    uploadToken: string,
  ) => {
    try {
      /*
       * --------------------------------
       * STEP 1: COMPRESS
       * --------------------------------
       */

      setCompressingImage(true);

      setUploadProgress(0);

      console.log(
        "Starting image compression..."
      );

      const compressedFile =
        await compressImage(file);

      setCompressingImage(false);

      const compressedSizeInKB =
        compressedFile.size /
        1024;

      setCompressedImageSize(
        `${compressedSizeInKB.toFixed(
          0
        )} KB after compression`
      );

      console.log(
        "Original image size:",
        `${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB`
      );

      console.log(
        "Compressed image size:",
        `${compressedSizeInKB.toFixed(
          0
        )} KB`
      );

      /*
       * Maximum compressed image:
       * 700 KB
       */
      const MAX_COMPRESSED_SIZE =
        700 * 1024;

      if (
        compressedFile.size >
        MAX_COMPRESSED_SIZE
      ) {
        throw new Error(
          "The compressed image is still too large. Please choose a smaller photo."
        );
      }

      /*
       * --------------------------------
       * STEP 2: UPLOAD TO CLOUDINARY
       * --------------------------------
       */

      setUploadingImage(true);

      setUploadProgress(0);

      const configResponse = await fetch("/api/cloudinary/config", {
        cache: "no-store",
      });
      const cloudinaryConfig = (await configResponse.json()) as {
        cloudName?: string;
        uploadPreset?: string;
        message?: string;
      };

      if (!configResponse.ok || !cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        throw new Error(cloudinaryConfig.message || "Cloudinary upload is not configured.");
      }

      const { cloudName, uploadPreset } = cloudinaryConfig;

      const formData = new FormData();
      formData.append(
        "file",
        compressedFile
      );
      formData.append(
        "upload_preset",
        uploadPreset
      );
      formData.append(
        "folder",
        "complaint-evidence"
      );
      formData.append(
        "public_id",
        complaintId
      );

      const evidenceUrl =
        await new Promise<string>(
          (resolve, reject) => {
            const request = new XMLHttpRequest();

            request.open(
              "POST",
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
            );
            request.timeout = 60000;

            request.upload.onprogress = (
              event
            ) => {
              if (event.lengthComputable) {
                setUploadProgress(
                  Math.round(
                    (event.loaded /
                      event.total) *
                      100
                  )
                );
              }
            };

            request.onerror = () =>
              reject(
                new Error(
                  "Cloudinary upload failed. Please check your network connection."
                )
              );

            request.ontimeout = () =>
              reject(
                new Error(
                  "Cloudinary upload timed out. Please try again."
                )
              );

            request.onload = () => {
              let response: {
                secure_url?: string;
                error?: {
                  message?: string;
                };
              } = {};

              try {
                response = JSON.parse(
                  request.responseText
                );
              } catch {
                reject(
                  new Error(
                    "Cloudinary returned an invalid response."
                  )
                );
                return;
              }

              if (
                request.status < 200 ||
                request.status >= 300 ||
                !response.secure_url
              ) {
                reject(
                  new Error(
                    response.error?.message ||
                      "Cloudinary did not return an image URL."
                  )
                );
                return;
              }

              setUploadProgress(100);
              resolve(response.secure_url);
            };

            request.send(formData);
          }
        );

      console.log(
        "Cloudinary image URL received."
      );

      /*
       * --------------------------------
       * STEP 4: SAVE URL TO FIRESTORE
       * --------------------------------
       */

      await updateComplaintEvidence(complaintId, uploadToken, {
        evidenceUrl,
        evidenceUploadStatus: "Uploaded",
        evidenceFileSize: compressedFile.size,
      });

      console.log(
        "Complaint photo successfully saved."
      );

      return evidenceUrl;
    } catch (error) {
      console.error(
        "Complaint evidence upload failed:",
        error
      );

      let errorMessage =
        "The photo upload failed.";

      if (
        error &&
        typeof error ===
          "object" &&
        "code" in error
      ) {
        const firebaseError =
          error as {
            code?: string;
            message?: string;
          };

        errorMessage =
          firebaseError.message ||
          "The photo upload failed.";
      }

      /*
       * If the error is a normal Error,
       * use its message.
       */
      else if (
        error instanceof Error
      ) {
        errorMessage =
          error.message;
      }

      /*
       * Try to update Firestore so the
       * admin can see that the upload failed.
       */
      try {
        await updateComplaintEvidence(complaintId, uploadToken, {
          evidenceUploadStatus: "Failed",
        });
      } catch (
        updateError
      ) {
        console.error(
          "Could not update image status:",
          updateError
        );
      }

      throw new Error(
        errorMessage
      );
    } finally {
      setCompressingImage(
        false
      );

      setUploadingImage(
        false
      );
    }
  };

  /*
   * Submit complaint.
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    setUploadProgress(0);

    const cleanName =
      formData.fullName.trim();

    const cleanPurok = formData.purok.trim();

    const cleanDescription =
      formData.description.trim();

    const cleanLocation =
      formData.locationOfConcern.trim();

    /*
    * Validate name and Purok.
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

       if (!cleanPurok || !isOfficialPurok(cleanPurok)) {
        setErrorMessage(
           "Please select an official Purok."
        );

        return;
      }

      if (verificationStatus !== "verified") {
        setErrorMessage("Please verify your resident information before submitting a named complaint.");
        return;
      }
    }

    

    /*
     * Validate description.
     */
    if (!cleanDescription) {
      setErrorMessage(
        "Please describe the concern."
      );

      return;
    }

    /*
     * Validate location.
     */
    if (!cleanLocation) {
      setErrorMessage(
        "Please enter the location of the concern."
      );

      return;
    }

    try {
      setSubmitting(true);

      /*
       * Anonymous complaints get a
       * private tracking code.
       */
      const trackingCode =
        formData.submissionType ===
        "Anonymous"
          ? await generateComplaintTrackingCode()
          : "";
      const cancellationToken = generateCancellationToken();
      const cancellationTokenHash = await hashCancellationToken(cancellationToken);
      const uploadToken = crypto.randomUUID().replace(/-/g, "");

      /*
       * --------------------------------
       * STEP 1
       * CREATE COMPLAINT
       * --------------------------------
       */

      console.log(
        "Creating complaint..."
      );

      const complaintRef =
        await addDoc(
          collection(
            db,
            "complaints"
          ),
          {
            submissionType:
              formData.submissionType,

            anonymous:
              formData.submissionType === "Anonymous",

            fullName:
              formData.submissionType ===
              "Anonymous"
                ? ""
                : cleanName,

             purok:
              formData.submissionType ===
              "Anonymous"
                ? ""
                 : cleanPurok,

            category:
              formData.category,

            description:
              cleanDescription,

            locationOfConcern:
              cleanLocation,

            incidentDate:
              formData.incidentDate,

            evidenceUrl: "",

            evidenceUploadStatus:
              evidenceFile
                ? "Uploading"
                : "No Photo",

            ...(evidenceFile ? { uploadToken } : {}),

            status: "Pending",

            cancellationTokenHash,

            trackingCode,

            adminNotes: "",

            assignedTo: "",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            resolvedAt: null,
          }
        );

      console.log(
        "Complaint created:",
        complaintRef.id
      );

      const residentLabel =
        formData.submissionType ===
        "Anonymous"
          ? "Anonymous resident"
          : cleanName;

      await logActivity({
        action:
          formData.submissionType === "Anonymous"
            ? "ANONYMOUS_COMPLAINT_SUBMITTED"
            : "COMPLAINT_SUBMITTED",
        category: "Complaints",
        description:
          formData.submissionType ===
          "Anonymous"
          ? "Anonymous complaint submitted successfully."
            : `${cleanName} submitted a facility concern about ${formData.category.toLowerCase()}.`,
        actorType: "resident",
        actorName:
          formData.submissionType ===
          "Anonymous"
            ? undefined
            : cleanName,
        referenceId: complaintRef.id,
        referenceType: "complaint",
        status: "Pending",
        metadata: {
          submissionType: formData.submissionType,
          category: formData.category,
        },
      });

      await createAdminNotification({
        title:
          formData.submissionType === "Anonymous"
            ? "New Anonymous Facility Concern"
            : "New Facility Concern",
        message:
          formData.submissionType === "Anonymous"
            ? "An anonymous facility concern was submitted."
            : `${cleanName} submitted a facility concern about ${formData.category.toLowerCase()}.`,
        type: "complaint",
        referenceId: complaintRef.id,
        referenceType: "complaint",
        actionUrl: "/admin/complaints",
        metadata:
          formData.submissionType === "Anonymous"
            ? { submissionType: "Anonymous" }
            : { category: formData.category },
      });

      /*
       * --------------------------------
       * STEP 2
       * UPLOAD PHOTO
       * --------------------------------
       */

      if (evidenceFile) {
        await uploadComplaintEvidence(
          complaintRef.id,
          evidenceFile,
          uploadToken
        );

        await logActivity({
          action: "COMPLAINT_PROOF_PHOTO_UPLOADED",
          category: "Complaints",
          description: `${residentLabel} uploaded proof photo evidence for a complaint.`,
          actorType: "resident",
          actorName:
            formData.submissionType ===
            "Anonymous"
              ? undefined
              : cleanName,
          referenceId: complaintRef.id,
          referenceType: "complaint",
          status: "Uploaded",
        });

        await createAdminNotification({
          title: "New Proof Photo",
          message:
            formData.submissionType === "Anonymous"
              ? "A proof photo was uploaded for an anonymous facility concern."
              : "A proof photo was uploaded for a facility concern.",
          type: "proof",
          referenceId: complaintRef.id,
          referenceType: "complaint",
          actionUrl: "/admin/complaints",
        });
      }

      /*
       * --------------------------------
       * STEP 3
       * SUCCESS
       * --------------------------------
       */

      setSubmittedTrackingCode(
        trackingCode
      );
      setTrackingCodeCopied(false);
      setSubmittedCancellationToken(cancellationToken);
      setCancellationTokenCopied(false);

      setFormData({
        submissionType:
          "Provide My Name",

        fullName: "",


        purok: "",

        category: "Peace and Order",

        description: "",

        locationOfConcern: "",

        incidentDate: "",
      });
      setEvidenceFile(null);

      setImageSize("");

      setCompressedImageSize("");

      setUploadProgress(0);

      setSubmitted(true);
    } catch (error) {
      console.error(
        "Complaint submission error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your concern. Please try again."
      );

      setSubmitted(false);
    } finally {
      setSubmitting(false);

      setUploadingImage(
        false
      );

      setCompressingImage(
        false
      );
    }
  };

  /*
   * --------------------------------
   * SUCCESS SCREEN
   * --------------------------------
   */

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">

          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900"
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
              {submittedTrackingCode ? "Complaint Submitted Successfully" : "Concern Submitted Successfully"}
            </h1>

            <p className="mt-3 text-gray-600">
              {submittedTrackingCode
                ? "Your complaint has been submitted anonymously."
                : "Thank you for submitting your community concern. The barangay personnel will review your submission."}
            </p>

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
                  You will need it to find your
                  anonymous complaint.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(submittedTrackingCode);
                        setTrackingCodeCopied(true);
                      } catch {
                        setTrackingCodeCopied(false);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-300 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Tracking Code
                  </button>
                  <Link
                    href={`/notifications?trackingCode=${encodeURIComponent(submittedTrackingCode)}`}
                    className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
                  >
                    Track My Complaint
                  </Link>
                </div>

                {trackingCodeCopied && <p className="mt-2 text-xs font-semibold text-green-700">Tracking code copied.</p>}

              </div>
            )}

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <ShieldCheck className="h-5 w-5 text-amber-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">Your Private Cancellation Token</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">Save this token somewhere safe. You will need it to cancel this complaint while its status is still Pending. This token is shown only now, so copy it before leaving this page.</p>
                  <p className="mt-3 break-all rounded-lg border border-amber-200 bg-white p-3 font-mono text-sm font-semibold text-gray-900">
                    {submittedCancellationToken}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(submittedCancellationToken);
                        setCancellationTokenCopied(true);
                      } catch {
                        setCancellationTokenCopied(false);
                      }
                    }}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Cancellation Token
                  </button>
                  {cancellationTokenCopied && (
                    <p className="mt-2 text-xs font-semibold text-green-700">Cancellation token copied.</p>
                  )}
                  <p className="mt-2 text-xs leading-5 text-amber-800">Do not share this token. Anyone who has it may be able to cancel this request while it is Pending.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-left">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <ImageIcon className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Submission saved successfully
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Your complaint information and
                    supporting photo have been
                    processed successfully.
                  </p>
                </div>

              </div>

            </div>

            <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5 text-left">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                  <Bell className="h-5 w-5 text-purple-700" />
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Track your request
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Open Notifications to view
                    the progress of your complaint
                    together with your other barangay
                    requests.
                  </p>
                </div>

              </div>

            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <Link
                href="/notifications"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
              >
                <Bell className="h-5 w-5" />
                Open Notifications
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
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
   * --------------------------------
   * MAIN FORM
   * --------------------------------
   */

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-purple-100">

          {/* HEADER */}

          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-8 text-white sm:px-8">

            <div className="flex items-start gap-4">

              <div className="rounded-2xl bg-white/15 p-3">
                <AlertTriangle className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Community Concern
                </h1>

                <p className="mt-1 text-sm text-purple-100">
                  Report a community concern or
                  public issue to Barangay Poblacion
                  North.
                </p>
              </div>

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-7 p-6 sm:p-8"
          >

            {/* SUBMISSION TYPE */}

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
                  disabled={submitting}
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
                  } disabled:cursor-not-allowed disabled:opacity-60`}
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
                  disabled={submitting}
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
                  } disabled:cursor-not-allowed disabled:opacity-60`}
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

            {/* NAME + PUROK */}

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
                    value={
                      formData.fullName
                    }
                    onChange={(event) =>
                      handleChange(
                        "fullName",
                        event.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    required
                    disabled={submitting}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Purok{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                   <ResidentLocationSelect id="complaintPurok" value={formData.purok} onChange={(value) => handleChange("purok", value)} />

                </div>

              </div>
            )}

            {formData.submissionType === "Provide My Name" && <ResidentVerificationPanel status={verificationStatus} />}

            

            {/* CATEGORY */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category
              </label>

              <select
                value={
                  formData.category
                }
                onChange={(event) => handleCategoryChange(event.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                {COMPLAINT_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>

            </div>

            {/* DESCRIPTION */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description of Concern{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <textarea
                value={
                  formData.description
                }
                onChange={(event) =>
                  handleChange(
                    "description",
                    event.target.value
                  )
                }
                rows={5}
                required
                disabled={submitting}
                placeholder={
                  formData.category === "Others"
                    ? "Please describe your specific concern..."
                    : getCategoryDescription(formData.category)
                }
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 placeholder:text-gray-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

            </div>

            {/* LOCATION */}

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
                value={
                  formData.locationOfConcern
                }
                onChange={(event) =>
                  handleChange(
                    "locationOfConcern",
                    event.target.value
                  )
                }
                placeholder="Example: Near Barangay Hall, Purok 2"
                required
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

            </div>

            {/* INCIDENT DATE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Incident Date
              </label>

              <input
                type="date"
                value={
                  formData.incidentDate
                }
                onChange={(event) =>
                  handleChange(
                    "incidentDate",
                    event.target.value
                  )
                }
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

            </div>

            {/* PHOTO */}

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
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      capture="environment"
                      disabled={submitting}
                      onChange={
                        handleEvidenceChange
                      }
                      className="block w-full cursor-pointer text-sm"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Optional. Upload a photo showing
                      the reported concern.
                    </p>

                    <p className="mt-1 text-xs text-purple-600">
                      Photos are automatically resized
                      and compressed before uploading.
                    </p>

                    {imageSize && (
                      <div className="mt-3 rounded-xl border border-purple-100 bg-white p-3">

                        <div className="flex items-center gap-2">

                          <ImageIcon className="h-4 w-4 text-purple-600" />

                          <p className="text-xs font-semibold text-gray-700">
                            {imageSize}
                          </p>

                        </div>

                        {compressedImageSize && (
                          <p className="mt-1 text-xs font-medium text-green-600">
                            {compressedImageSize}
                          </p>
                        )}

                      </div>
                    )}

                    {/* COMPRESSING */}

                    {compressingImage && (
                      <div className="mt-3 rounded-xl bg-purple-100 p-3">

                        <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">

                          <Loader2 className="h-4 w-4 animate-spin" />

                          Compressing photo...

                        </div>

                        <p className="mt-1 text-[11px] text-purple-600">
                          Preparing the photo for a faster upload.
                        </p>

                      </div>
                    )}

                    {/* UPLOADING */}

                    {uploadingImage && (
                      <div className="mt-3 rounded-xl bg-purple-100 p-3">

                        <div className="flex items-center justify-between gap-2">

                          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">

                            <Loader2 className="h-4 w-4 animate-spin" />

                            Uploading photo...

                          </div>

                          <span className="text-xs font-bold text-purple-700">
                            {uploadProgress}%
                          </span>

                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-200">

                          <div
                            className="h-full rounded-full bg-purple-600 transition-all duration-300"
                            style={{
                              width: `${uploadProgress}%`,
                            }}
                          />

                        </div>

                        <p className="mt-2 text-[11px] text-purple-600">
                          Please keep this page open
                          until the upload finishes.
                        </p>

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* PRIVACY */}

            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">

              {formData.submissionType ===
              "Anonymous" ? (
                <div className="flex gap-3">

                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

                  <p>
                    Your identity will not be
                    recorded. You will receive a
                    private tracking code after
                    submitting.
                  </p>

                </div>
              ) : (
                <div className="flex gap-3">

                  <User className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

                  <p>
                     Your name and Purok will
                    help you find this submission
                    later through Notifications.
                  </p>

                </div>
              )}

            </div>

            {/* ERROR */}

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">

                <p className="font-semibold">
                  Submission Error
                </p>

                <p className="mt-1">
                  {errorMessage}
                </p>

              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={submitting || (formData.submissionType === "Provide My Name" && verificationStatus !== "verified")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />

                  {compressingImage
                    ? "Compressing Photo..."
                    : uploadingImage
                      ? `Uploading Photo... ${uploadProgress}%`
                      : "Submitting Concern..."}
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

      </div>
    </main>
  );
}
