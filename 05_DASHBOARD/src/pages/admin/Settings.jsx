import AccountSettingsPage from "../../components/common/AccountSettingsPage";

const fields = [
  { id: "fullName", label: "Full Name" },
  { id: "email", label: "Email Address", type: "email" },
  { id: "mainContact", label: "Main Contact Number" },
];

const notificationItems = [
  {
    id: "assessment_notifications",
    title: "Assessment notifications",
    description:
      "Receive notifications when new assessments are created or updated.",
  },
  {
    id: "assessment_schedule_notifications",
    title: "Assessment schedule notifications",
    description:
      "Receive reminders and updates regarding assessment schedules.",
  },
  {
    id: "assessment_completion_notifications",
    title: "Assessment completion notifications",
    description:
      "Receive notifications when assessments are completed.",
  },
  {
    id: "results_notifications",
    title: "Results notifications",
    description:
      "Receive notifications when assessment results are available.",
  },
  {
    id: "certificate_notifications",
    title: "Certificate notifications",
    description:
      "Receive notifications when certificates are generated or issued.",
  },
  {
    id: "user_registration_notifications",
    title: "User registration notifications",
    description:
      "Receive notifications when new users register in the system.",
  },
  {
    id: "system_announcements",
    title: "System announcements",
    description:
      "Receive important updates and announcements from the system.",
  },
  {
    id: "administrative_alerts",
    title: "Administrative alerts",
    description:
      "Receive critical system and administrative alerts.",
  },
];

export default function Settings() {
  return (
    <AccountSettingsPage
      role="Admin"
      avatar="/admin.jpg"
      officeLabel="Account Role"
      officeValue="Administrator"
      fields={fields}
      notificationItems={notificationItems}
    />
  );
}

