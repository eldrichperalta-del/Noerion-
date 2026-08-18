import AccountSettingsPage from "../../components/common/AccountSettingsPage";

const fields = [
  { id: "fullName", label: "Full Name" },
  { id: "email", label: "Email Address", type: "email" },
  { id: "mainContact", label: "Main Contact Number" },
  { id: "altContact", label: "Alt. Contact Number" },
  { id: "position", label: "Position / Designation" },
  { id: "office", label: "Institution / Office" },
];

const notificationItems = [
  ["assessment", "Assessment notifications", "Receive notifications when new assessments are created or updated."],
  ["schedule", "Assessment schedule notifications", "Receive reminders and updates regarding assessment schedules."],
  ["completion", "Assessment completion notifications", "Receive notifications when assessments are completed."],
  ["results", "Results notifications", "Receive notifications when assessment results are available."],
  ["certificates", "Certificate notifications", "Receive notifications when certificates are generated or issued."],
  ["registration", "User registration notifications", "Receive notifications when new users register in the system."],
  ["announcements", "System announcements", "Receive important updates and announcements from the system."],
  ["alerts", "Administrative alerts", "Receive critical system and administrative alerts."],
].map(([id, title, description]) => ({ id, title, description }));

export default function Settings() {
  return <AccountSettingsPage role="TESDA Administrator" avatar="/admin.jpg" officeLabel="Institution / Office" officeValue="TESDA Provincial Office - NCR" fields={fields} notificationItems={notificationItems} initialValues={{ fullName: "Juan Dela Cruz", email: "juan.delacruz@tesda.gov.ph", mainContact: "(02) 8123 4567", altContact: "0917 123 4567", position: "Provincial Director", office: "TESDA Provincial Office - NCR" }} />;
}
