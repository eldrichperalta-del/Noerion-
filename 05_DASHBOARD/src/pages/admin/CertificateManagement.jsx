import { useEffect, useMemo, useState } from "react";

import CertificateOverviewCards from "../../components/admin/certificate-management/CertificateOverviewCards.jsx";
import CertificateFilters from "../../components/admin/certificate-management/CertificateFilters.jsx";
import CertificateTable from "../../components/admin/certificate-management/CertificateTable.jsx";
import CertificateDetailsModal from "../../components/admin/certificate-management/CertificateDetailsModal.jsx";
import CertificateTrackingModal from "../../components/admin/certificate-management/CertificateTrackingModal.jsx";
import RevokeCertificateModal from "../../components/admin/certificate-management/RevokeCertificateModal.jsx";
import CertificateUploadModal from "../../components/admin/certificate-management/CertificateUploadModal.jsx";
import DashboardPageHeader from "../../components/common/DashboardPageHeader.jsx";

import { supabase } from "../../supabaseClient.js";

// ==========================================
// CERTIFICATE ASSETS
// ==========================================

import tesdaLogo from "../../assets/tesda1.png";
import certificateBorder from "../../assets/certificate-border-frame.png";

export default function CertificateManagement() {
// ==========================================
// FILTER STATE
// ==========================================

const [search, setSearch] = useState("");
const [status, setStatus] = useState("All");
const [day, setDay] = useState("");
const [month, setMonth] = useState("");
const [year, setYear] = useState("");

// ==========================================
// UI STATE
// ==========================================

const [
selectedCertificate,
setSelectedCertificate,
] = useState(null);

const [
selectedCertificateIndex,
setSelectedCertificateIndex,
] = useState(0);

const [
showDetailsModal,
setShowDetailsModal,
] = useState(false);

const [
showTrackingModal,
setShowTrackingModal,
] = useState(false);

const [
showRevokeModal,
setShowRevokeModal,
] = useState(false);

const [
openUpload,
setOpenUpload,
] = useState(false);

// ==========================================
// DATA STATE
// ==========================================

const [
allCertificates,
setAllCertificates,
] = useState([]);

const [
loading,
setLoading,
] = useState(false);

const [
error,
setError,
] = useState(null);

// ==========================================
// LOAD CERTIFICATES
// ==========================================

const loadCertificates = async () => {
try {
setLoading(true);
setError(null);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      "Your Supabase session is missing. Please log in again."
    );
  }

  // ==========================================
  // LOAD CERTIFICATES
  // ==========================================

  const {
    data: certificates,
    error: certificateError,
  } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_id,
      trainee_id,
      assessment_id,
      qualification,
      issued_on,
      result,
      token,
      hash,
      signature,
      status,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (certificateError) {
    throw new Error(
      certificateError.message ||
        "Unable to load certificates from Supabase."
    );
  }

  // ==========================================
  // GET TRAINEE IDS
  // ==========================================

  const traineeIds = [
    ...new Set(
      (certificates || [])
        .map(
          (certificate) =>
            certificate.trainee_id
        )
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // LOAD TRAINEE PROFILES
  // ==========================================

  let profiles = [];

  if (traineeIds.length > 0) {
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        suffix
      `)
      .in(
        "id",
        traineeIds
      );

    if (profileError) {
      console.warn(
        "Unable to load trainee profiles:",
        profileError
      );
    } else {
      profiles =
        profileData || [];
    }
  }

  // ==========================================
  // PROFILE MAP
  // ==========================================

  const profileMap =
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  // ==========================================
  // FORMAT CERTIFICATES
  // ==========================================

  const formattedCertificates =
    (certificates || []).map(
      (certificate) => {
        const profile =
          profileMap.get(
            certificate.trainee_id
          );

        const traineeName = [
          profile?.first_name,
          profile?.middle_name,
          profile?.last_name,
          profile?.suffix,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        return {
          id:
            certificate.id,

          certificateId:
            certificate.certificate_id,

          traineeId:
            certificate.trainee_id,

          assessmentId:
            certificate.assessment_id,

          traineeName:
            traineeName || "—",

          studentId:
            certificate.trainee_id || "—",

          course:
            certificate.qualification || "—",

          qualification:
            certificate.qualification || "—",

          skill:
            certificate.qualification || "—",

          dateIssued:
            certificate.issued_on,

          issuedOn:
            certificate.issued_on,

          result:
            certificate.result || "Passed",

          token:
            certificate.token,

          hash:
            certificate.hash,

          signature:
            certificate.signature,

          status:
            certificate.status || "Unknown",

          verificationStatus:
            certificate.status === "Valid"
              ? "Verified"
              : certificate.status === "Revoked"
              ? "Revoked"
              : certificate.status ||
                "Unknown",

          lastVerificationDate:
            null,

          createdAt:
            certificate.created_at,

          qrCodeUrl:
            "",
        };
      }
    );

  setAllCertificates(
    formattedCertificates
  );
} catch (err) {
  console.error(
    "Failed to load certificates:",
    err
  );

  setAllCertificates([]);

  setError(
    err?.message ||
      "Failed to load certificates."
  );
} finally {
  setLoading(false);
}

};

// ==========================================
// INITIAL LOAD
// ==========================================

useEffect(() => {
loadCertificates();
}, []);

// ==========================================
// FRONTEND FILTERING
// ==========================================

const filtered = useMemo(() => {
const normalizedSearch =
search
.trim()
.toLowerCase();

return allCertificates.filter(
  (certificate) => {
    const traineeName =
      certificate.traineeName || "";

    const certificateId =
      certificate.certificateId || "";

    const traineeId =
      certificate.traineeId || "";

    const studentId =
      certificate.studentId || "";

    const qualification =
      certificate.qualification ||
      certificate.course ||
      "";

    const searchMatch =
      !normalizedSearch ||
      traineeName
        .toLowerCase()
        .includes(
          normalizedSearch
        ) ||
      certificateId
        .toLowerCase()
        .includes(
          normalizedSearch
        ) ||
      traineeId
        .toLowerCase()
        .includes(
          normalizedSearch
        ) ||
      studentId
        .toLowerCase()
        .includes(
          normalizedSearch
        ) ||
      qualification
        .toLowerCase()
        .includes(
          normalizedSearch
        );

    const statusMatch =
      status === "All" ||
      certificate.status === status;

    const dateValue =
      certificate.dateIssued;

    const date =
      dateValue
        ? new Date(dateValue)
        : null;

    const validDate =
      date &&
      !Number.isNaN(
        date.getTime()
      );

    const dayMatch =
      !day ||
      (
        validDate &&
        date.getDate() ===
          Number(day)
      );

    const monthMatch =
      !month ||
      (
        validDate &&
        date.getMonth() + 1 ===
          Number(month)
      );

    const yearMatch =
      !year ||
      (
        validDate &&
        date.getFullYear() ===
          Number(year)
      );

    return (
      searchMatch &&
      statusMatch &&
      dayMatch &&
      monthMatch &&
      yearMatch
    );
  }
);

}, [
allCertificates,
search,
status,
day,
month,
year,
]);

// ==========================================
// FILTER ACTIONS
// ==========================================

const handleApplyFilters = () => {
console.log(
"Certificate filters applied:",
{
search,
status,
day,
month,
year,
}
);
};

const handleClearFilters = () => {
setSearch("");
setStatus("All");
setDay("");
setMonth("");
setYear("");
};

// ==========================================
// VIEW CERTIFICATE DETAILS
// ==========================================

const handleViewCertificate = (
certificate
) => {
const index =
filtered.findIndex(
(item) =>
item.certificateId ===
certificate.certificateId
);

setSelectedCertificate(
  certificate
);

setSelectedCertificateIndex(
  index >= 0
    ? index
    : 0
);

setShowDetailsModal(true);

};

// ==========================================
// DOWNLOAD CERTIFICATE
// DIRECT PRINT WINDOW - NO STACKED PREVIEW
// ==========================================

const handleDownloadCertificate = (
  certificate
) => {
  if (!certificate?.certificateId) {
    console.error(
      "Cannot download certificate: missing certificate ID."
    );

    return;
  }

  const rawDate =
    certificate.issuedOn ||
    certificate.dateIssued ||
    "";

  let displayDate = "—";

  if (rawDate) {
    const parsedDate =
      new Date(rawDate);

    if (
      !Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      displayDate =
        parsedDate.toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        );
    }
  }

  const traineeName =
    certificate.traineeName ||
    "Trainee Name";

  const qualification =
    certificate.qualification ||
    certificate.course ||
    "Qualification";

  const result =
    certificate.result ||
    "Passed";

  const certificateId =
    String(
      certificate.certificateId
    ).replace(/^#/, "");

  const verificationUrl =
    `${globalThis.location.origin}/verify/${encodeURIComponent(
      certificateId
    )}`;

  // ==========================================
  // PREVENT HTML BREAKING
  // ==========================================

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeTraineeName =
    escapeHtml(traineeName);

  const safeQualification =
    escapeHtml(qualification);

  const safeResult =
    escapeHtml(result);

  const safeCertificateId =
    escapeHtml(certificateId);

  const safeDisplayDate =
    escapeHtml(displayDate);

  // ==========================================
  // REMOVE OLD PRINT FRAME
  // ==========================================

  const existingFrame =
    document.getElementById(
      "certificate-print-frame"
    );

  if (existingFrame) {
    existingFrame.remove();
  }

  // ==========================================
  // CREATE HIDDEN PRINT FRAME
  // ==========================================

  const printFrame =
    document.createElement("iframe");

  printFrame.id =
    "certificate-print-frame";

  printFrame.setAttribute(
    "aria-hidden",
    "true"
  );

  printFrame.style.position =
    "fixed";

  printFrame.style.width =
    "0";

  printFrame.style.height =
    "0";

  printFrame.style.border =
    "0";

  printFrame.style.opacity =
    "0";

  printFrame.style.pointerEvents =
    "none";

  printFrame.style.left =
    "-9999px";

  printFrame.style.top =
    "-9999px";

  document.body.appendChild(
    printFrame
  );

  const printDocument =
    printFrame.contentDocument ||
    printFrame.contentWindow?.document;

  if (!printDocument) {
    printFrame.remove();

    setError(
      "Unable to prepare the certificate for download."
    );

    return;
  }

  printDocument.open();

  printDocument.write(`
    <!DOCTYPE html>

    <html>
      <head>

        <meta charset="UTF-8" />

        <title>
          Certificate of Competency - ${safeTraineeName}
        </title>

        <style>

          @page {
            size: landscape;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: white;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          body {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .certificate {
            position: relative;
            width: 1120px;
            height: 745px;
            overflow: hidden;
            background: white;
            color: #111827;
          }

          .border-image {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: fill;
            pointer-events: none;
            z-index: 1;
          }

          .certificate-content {
            position: relative;
            z-index: 2;
            width: 100%;
            height: 100%;
            padding:
              48px
              95px
              38px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
            flex-shrink: 0;
          }

          .tesda {
            margin: 4px 0 0;
            color: #102a6c;
            font-size: 16px;
            font-weight: 800;
            line-height: 1;
          }

          .subtitle {
            margin: 16px 0 4px;
            font-size: 20px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .title {
            margin: 0;
            color: #071d5b;
            font-size: 36px;
            font-weight: 800;
            text-transform: uppercase;
            line-height: 1.1;
          }

          .content {
            max-width: 850px;
            margin-top: 22px;
            font-size: 19px;
            line-height: 1.55;
            font-weight: 500;
          }

          .content p {
            margin: 13px 0;
          }

          .qualification {
            color: #071d5b;
            font-size: 25px;
            font-weight: 800;
            line-height: 1.2;
          }

          .footer {
            width: 100%;
            margin-top: auto;
            display: grid;
            grid-template-columns:
              1fr
              1fr
              100px;
            gap: 45px;
            align-items: end;
            padding:
              0
              30px;
          }

          .signature-space {
            height: 40px;
          }

          .signature-label {
            border-top:
              2px
              solid
              #111827;

            padding-top: 6px;

            font-size: 13px;

            font-weight: 800;
          }

          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .qr {
            width: 82px;
            height: 82px;
            display: flex;
            align-items: center;
            justify-content: center;
            border:
              2px
              solid
              #111827;
            background: white;
            overflow: hidden;
          }

          .qr img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .qr-label {
            margin:
              5px
              0
              0;

            font-size: 10px;

            font-weight: 800;
          }

          .verification {
            margin:
              15px
              0
              0;

            font-size: 12px;

            font-style: italic;
          }

          @media print {

            html,
            body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }

            .certificate {
              width: 100vw;
              height: 100vh;
            }

          }

        </style>

      </head>

      <body>

        <main class="certificate">

          <img
            class="border-image"
            src="${certificateBorder}"
            alt=""
          />

          <section
            class="certificate-content"
          >

            <img
              class="logo"
              src="${tesdaLogo}"
              alt="TESDA"
            />

            <p class="tesda">
              TESDA
            </p>

            <p class="subtitle">
              National Certificate
            </p>

            <h1 class="title">
              Certificate of Competency
            </h1>

            <div class="content">

              <p>
                This is to certify that
                <strong>
                  ${safeTraineeName}
                </strong>
                has successfully demonstrated competency in
              </p>

              <p class="qualification">
                ${safeQualification}
              </p>

              <p>
                Having undergone the required assessment, the individual has successfully demonstrated the competencies prescribed for the qualification stated above and has been assessed as
                <strong>
                  ${safeResult}
                </strong>.
              </p>

              <p>
                This Certificate of Competency is issued in recognition of the successful demonstration of the required competencies and is dated
                <strong>
                  ${safeDisplayDate}
                </strong>,
                under Certificate Number
                <strong>
                  ${safeCertificateId}
                </strong>.
              </p>

            </div>

            <div class="footer">

              <div>

                <div
                  class="signature-space"
                ></div>

                <div
                  class="signature-label"
                >
                  Assessor Name &amp; Signature
                </div>

              </div>

              <div>

                <div
                  class="signature-space"
                ></div>

                <div
                  class="signature-label"
                >
                  TESDA Authority Signature
                </div>

              </div>

              <div
                class="qr-container"
              >

                <div
                  class="qr"
                >

                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      verificationUrl
                    )}"
                    alt="Certificate Verification QR Code"
                  />

                </div>

                <p
                  class="qr-label"
                >
                  Scan to Verify
                </p>

              </div>

            </div>

            <p
              class="verification"
            >
              This certificate is digitally verified through the NOERION system.
            </p>

          </section>

        </main>

      </body>

    </html>
  `);

  printDocument.close();

  // ==========================================
  // WAIT FOR CERTIFICATE ASSETS
  // ==========================================

  const printImages =
    Array.from(
      printDocument.images
    );

  Promise.all(
    printImages.map(
      (image) =>
        new Promise(
          (resolve) => {
            if (
              image.complete &&
              image.naturalWidth > 0
            ) {
              resolve();
              return;
            }

            image.addEventListener(
              "load",
              resolve,
              {
                once: true,
              }
            );

            image.addEventListener(
              "error",
              resolve,
              {
                once: true,
              }
            );
          }
        )
    )
  ).then(() => {
    setTimeout(
      () => {
        const frameWindow =
          printFrame.contentWindow;

        if (!frameWindow) {
          printFrame.remove();

          return;
        }

        const removeFrame = () => {
          setTimeout(
            () => {
              printFrame.remove();
            },
            500
          );
        };

        frameWindow.addEventListener(
          "afterprint",
          removeFrame,
          {
            once: true,
          }
        );

        frameWindow.focus();

        frameWindow.print();

        // Fallback cleanup.
        setTimeout(
          () => {
            if (
              document.body.contains(
                printFrame
              )
            ) {
              printFrame.remove();
            }
          },
          30000
        );
      },
      500
    );
  });
};

// ==========================================
// PREVIOUS CERTIFICATE
// ==========================================

const handlePreviousCertificate = () => {
if (
selectedCertificateIndex <= 0
) {
return;
}

const newIndex =
  selectedCertificateIndex - 1;

setSelectedCertificateIndex(
  newIndex
);

setSelectedCertificate(
  filtered[newIndex]
);

};

// ==========================================
// NEXT CERTIFICATE
// ==========================================

const handleNextCertificate = () => {
if (
selectedCertificateIndex >=
filtered.length - 1
) {
return;
}

const newIndex =
  selectedCertificateIndex + 1;

setSelectedCertificateIndex(
  newIndex
);

setSelectedCertificate(
  filtered[newIndex]
);

};

// ==========================================
// REVOKE CERTIFICATE
// ==========================================

const handleRevoke = async (
certificate
) => {
if (
!certificate?.certificateId
) {
console.error(
"Cannot revoke certificate: missing certificate ID."
);

  return;
}

try {
  setLoading(true);
  setError(null);

  const {
    error: revokeError,
  } = await supabase
    .from("certificates")
    .update({
      status: "Revoked",
    })
    .eq(
      "certificate_id",
      certificate.certificateId
    );

  if (revokeError) {
    throw new Error(
      revokeError.message ||
        "Failed to revoke certificate."
    );
  }

  setAllCertificates(
    (previous) =>
      previous.map(
        (item) =>
          item.certificateId ===
          certificate.certificateId
            ? {
                ...item,
                status: "Revoked",
                verificationStatus:
                  "Revoked",
              }
            : item
      )
  );
} catch (err) {
  console.error(
    "Certificate revoke failed:",
    err
  );

  setError(
    err?.message ||
      "Failed to revoke certificate."
  );
} finally {
  setLoading(false);

  setShowRevokeModal(false);

  setSelectedCertificate(null);

  setSelectedCertificateIndex(0);
}

};

// ==========================================
// CERTIFICATE SAVED
// ==========================================

const handleCertificateSaved =
async (
newCertificate
) => {
try {
setError(null);

    if (newCertificate) {
      console.log(
        "Certificate saved:",
        newCertificate
      );
    }

    await loadCertificates();

    setOpenUpload(false);
  } catch (err) {
    console.error(
      "Failed to refresh certificates:",
      err
    );

    setError(
      err?.message ||
        "Certificate was saved, but the list could not be refreshed."
    );
  }
};

// ==========================================
// RENDER
// ==========================================

return ( <div className="cert-page">

  <DashboardPageHeader
    title="Certificate Management"
    subtitle="Issue, monitor, and manage trainee certificates and their verification status."
  />

  <CertificateOverviewCards
    data={allCertificates}
  />

  <CertificateFilters
    search={search}
    setSearch={setSearch}
    status={status}
    setStatus={setStatus}
    day={day}
    setDay={setDay}
    month={month}
    setMonth={setMonth}
    year={year}
    setYear={setYear}
    onApply={
      handleApplyFilters
    }
    onClear={
      handleClearFilters
    }
  />

  {error && (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">

      <p className="font-medium">
        Certificate Management Error
      </p>

      <p className="mt-1 text-sm">
        {error}
      </p>

    </div>
  )}

  <div className="table-section">

    <CertificateTable
      certificates={filtered}
      loading={loading}
      error={null}
      onView={
        handleViewCertificate
      }
      onDownload={
        handleDownloadCertificate
      }
      onTrack={(item) => {
        setSelectedCertificate(
          item
        );

        setShowTrackingModal(
          true
        );
      }}
      onRevoke={(item) => {
        setSelectedCertificate(
          item
        );

        setShowRevokeModal(
          true
        );
      }}
    />

  </div>

  <CertificateDetailsModal
    open={showDetailsModal}
    certificate={
      selectedCertificate
    }
    certificates={filtered}
    currentIndex={
      selectedCertificateIndex
    }
    onPrevious={
      handlePreviousCertificate
    }
    onNext={
      handleNextCertificate
    }
    onClose={() => {
      setShowDetailsModal(false);

      setSelectedCertificate(
        null
      );

      setSelectedCertificateIndex(
        0
      );
    }}
  />

  <CertificateTrackingModal
    open={showTrackingModal}
    certificate={
      selectedCertificate
    }
    onClose={() => {
      setShowTrackingModal(false);

      setSelectedCertificate(
        null
      );
    }}
  />

  <RevokeCertificateModal
    open={showRevokeModal}
    certificate={
      selectedCertificate
    }
    onClose={() => {
      setShowRevokeModal(false);

      setSelectedCertificate(
        null
      );
    }}
    onRevoke={
      handleRevoke
    }
  />

  {openUpload && (
    <CertificateUploadModal
      onClose={() =>
        setOpenUpload(false)
      }
      onSave={
        handleCertificateSaved
      }
    />
  )}

</div>
);
}
