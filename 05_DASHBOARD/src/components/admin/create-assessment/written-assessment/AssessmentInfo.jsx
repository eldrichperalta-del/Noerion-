export default function AssessmentInfo({ assessmentData, setAssessmentData }) {
  const updateField = (field, value) => setAssessmentData((current) => ({ ...current, [field]: value }));

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-semibold">Assessment Information</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <input value={assessmentData.title} onChange={(event) => updateField("title", event.target.value)} className="rounded-lg border p-3" placeholder="Assessment Title" />
        <input value={assessmentData.qualification} onChange={(event) => updateField("qualification", event.target.value)} className="rounded-lg border p-3" placeholder="Qualification" />
      </div>
      <textarea value={assessmentData.instructions} onChange={(event) => updateField("instructions", event.target.value)} className="w-full rounded-lg border p-3" placeholder="Assessment Instructions" />
    </div>
  );
}
