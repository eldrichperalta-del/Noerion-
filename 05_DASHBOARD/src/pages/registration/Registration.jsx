import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CalendarDays, Check, CheckCircle2, ClipboardCheck, GraduationCap,
  Eye, EyeOff, IdCard, ImagePlus, Info, LockKeyhole, Mail, Upload, UserRound, X, Loader2
} from "lucide-react";
import AnimatedWave from "../login/AnimatedWave";
import { supabase } from "../../supabaseClient"; // Ensure path points to your supabase client

const inputClass = "w-full h-11 rounded-xl border border-cyan-300/30 bg-slate-800/70 px-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";

function Progress({ step }) {
  return (
    <>
      <p className="mb-1 text-xs text-slate-300">Step {step} of 3</p>
      <div className="relative mb-6 flex items-center justify-between before:absolute before:left-4 before:right-4 before:h-0.5 before:bg-slate-300/75">
        {[1, 2, 3].map((number) => (
          <span key={number} className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${number < step ? "bg-cyan-400 text-slate-950" : number === step ? "bg-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,.9)]" : "bg-slate-200 text-slate-700"}`}>
            {number < step ? <Check size={15} /> : number}
          </span>
        ))}
      </div>
    </>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <label className="relative block">
      <Icon size={15} className="pointer-events-none absolute left-3 top-3 text-cyan-200/75" />
      <input className={`${inputClass} pl-9`} {...props} />
    </label>
  );
}

export default function Registration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [documents, setDocuments] = useState({ accreditation: null, governmentId: null });
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isAssessor = role === "assessor";
  const heading = step === 3 ? (isAssessor ? "TESDA Assessor Information & Verification" : "Training Information & Verification") : "Account Registration";
  
  const formReady = useMemo(() => 
    form.firstName && form.lastName && form.gender && form.birthDate && form.contactNumber && form.email && form.password && form.password === form.confirmPassword, 
  [form]);

  const stepThreeReady = isAssessor
    ? form.assessorId && form.assessmentCenter && form.specialization && photoFile && documents.accreditation && accepted
    : form.trainingCenter && form.ncLevel && form.qualification && photoFile && accepted;

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const choosePhoto = (event) => { 
    const file = event.target.files?.[0]; 
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file)); 
    }
  };

  const clearPhoto = () => { 
    setPhotoFile(null);
    setPhotoPreview(""); 
    setPhotoInputKey((key) => key + 1); 
  };

  const uploadFile = async (file, bucket, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Register Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Could not create authentication user.");

      // 2. Upload Profile Photo
      let profilePhotoUrl = "";
      if (photoFile) {
        profilePhotoUrl = await uploadFile(photoFile, "avatars", userId);
      }

      // 3. Insert/Upsert into public.profiles
      const formattedRole = isAssessor ? "assessor" : "trainee";
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        role: formattedRole,
        first_name: form.firstName,
        middle_name: form.middleName || null,
        last_name: form.lastName,
        suffix: form.suffix || null,
        gender: form.gender,
        date_of_birth: form.birthDate,
        contact_number: form.contactNumber,
        email: form.email,
        profile_photo_url: profilePhotoUrl,
        approval_status: "Pending Approval",
      });

      if (profileError) throw profileError;

      // 4. Insert into role-specific table
      if (isAssessor) {
        let accreditationUrl = "";
        let governmentIdUrl = "";

        if (documents.accreditation) {
          accreditationUrl = await uploadFile(documents.accreditation, "verification-docs", `${userId}/accreditation`);
        }
        if (documents.governmentId) {
          governmentIdUrl = await uploadFile(documents.governmentId, "verification-docs", `${userId}/gov_id`);
        }

        const { error: assessorError } = await supabase.from("assessor_profiles").insert({
          user_id: userId,
          assessor_id_number: form.assessorId,
          qualification_specialization: form.specialization,
          assessment_center: form.assessmentCenter,
          years_of_experience: form.experience ? parseInt(form.experience, 10) : null,
          accreditation_cert_url: accreditationUrl,
          government_id_url: governmentIdUrl,
        });

        if (assessorError) throw assessorError;
      } else {
        const { error: traineeError } = await supabase.from("trainee_profiles").insert({
          user_id: userId,
          training_center: form.trainingCenter,
          nc_level: form.ncLevel,
          qualification_course: form.qualification,
          batch: form.batch || null,
        });

        if (traineeError) throw traineeError;
      }

      // 5. SIGN OUT THE USER IMMEDIATELY
      // Prevents pending users from being logged in right after registration
      await supabase.auth.signOut();

      setStep(4); // Move to Success Screen
    } catch (err) {
      setErrorMessage(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const next = () => { 
    if (step === 1 && !role) return; 
    if (step === 2 && !formReady) return; 
    if (step === 3 && stepThreeReady) handleSubmit(); 
    else if (step < 3) setStep(step + 1); 
  };

  const back = () => step === 1 ? navigate("/login") : setStep(step - 1);

  if (step === 4) return <Success onLogin={() => navigate("/login")} />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040814] px-4 py-8">
      <AnimatedWave />
      <div className="absolute -left-32 -top-40 h-[500px] w-[500px] bg-cyan-400/20 blur-[180px]" />
      <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] bg-purple-500/20 blur-[180px]" />
      <main className={`relative z-10 w-full ${step === 3 && isAssessor ? "max-w-4xl" : "max-w-2xl"} rounded-[28px] border border-cyan-300/40 bg-slate-950/80 p-5 shadow-[0_0_20px_rgba(0,242,255,.32),0_0_70px_rgba(0,242,255,.18)] backdrop-blur-[30px] sm:p-8`}>
        <div className="mb-4 text-center">
          <div className="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">NOERION</div>
          <h1 className="mt-4 text-2xl font-bold text-white">{heading}</h1>
          {step < 3 && <p className="mt-1 text-sm text-slate-400">Register for a NOERION account.</p>}
          {step === 3 && isAssessor && <p className="mt-1 text-xs text-slate-400">Provide your professional information and upload documents for administrator verification.</p>}
        </div>

        <Progress step={step} />

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-300 text-center">
            {errorMessage}
          </div>
        )}

        {step === 1 && <AccountType role={role} onChange={setRole} />}
        {step === 2 && <PersonalForm form={form} update={update} />}
        {step === 3 && (
          <Verification 
            isAssessor={isAssessor} 
            form={form} 
            update={update} 
            documents={documents} 
            setDocuments={setDocuments} 
            photoPreview={photoPreview} 
            photoInputKey={photoInputKey} 
            choosePhoto={choosePhoto} 
            clearPhoto={clearPhoto} 
            accepted={accepted} 
            setAccepted={setAccepted} 
          />
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-600/30 pt-5">
          <button onClick={back} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-900">
            <ArrowLeft size={16} />{step === 1 ? "Back to Login" : "Back"}
          </button>
          <button 
            onClick={next} 
            disabled={loading || (step === 1 && !role) || (step === 2 && !formReady) || (step === 3 && !stepThreeReady)} 
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_14px_rgba(45,212,191,.55)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {step === 3 ? "Submit Registration" : "Continue"}
          </button>
        </div>
        {step === 2 && !formReady && form.password && <p className="mt-3 text-center text-xs text-amber-300">Complete the required fields and ensure both passwords match to continue.</p>}
      </main>
    </div>
  );
}

function AccountType({ role, onChange }) {
  const choices = [{ key: "trainee", label: "Trainee", Icon: GraduationCap, description: "Develop your skills, access comprehensive training resources, and track your progress in your professional development journey." }, { key: "assessor", label: "Assessor", Icon: ClipboardCheck, description: "Evaluate performances, provide valuable feedback to trainees, and manage assessments within your designated programs." }];
  return <section><h2 className="mb-3 text-base font-semibold text-slate-100">Select Account Type</h2><div className="grid gap-3 sm:grid-cols-2">{choices.map(({ key, label, Icon, description }) => <button key={key} onClick={() => onChange(key)} className={`min-h-52 rounded-xl border p-5 text-center transition ${role === key ? "border-cyan-300 bg-cyan-300/10 shadow-[0_0_18px_rgba(34,211,238,.4)]" : "border-slate-500/40 bg-slate-900/50 hover:border-cyan-300/60"}`}><Icon className="mx-auto mb-3 text-cyan-200" size={42} /><span className="block text-base font-bold text-white">{label}</span><span className="mt-2 block text-xs leading-5 text-slate-300">{description}</span></button>)}</div></section>;
}

function PasswordField({ name, placeholder, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return <label className="relative block"><LockKeyhole size={15} className="pointer-events-none absolute left-3 top-3 text-cyan-200/75" /><input className={`${inputClass} px-9 pr-10`} name={name} value={value || ""} onChange={onChange} placeholder={placeholder} type={visible ? "text" : "password"} /><button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-2.5 text-cyan-300" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></label>;
}

function PersonalForm({ form, update }) {
  const fields = [["firstName", "First Name", UserRound], ["lastName", "Last Name", UserRound], ["middleName", "Middle Name (Optional)", UserRound], ["suffix", "Suffix (Optional)", UserRound], ["contactNumber", "Contact Number", IdCard], ["email", "Personal Email Address", Mail], ["password", "Password", LockKeyhole], ["confirmPassword", "Confirm Password", LockKeyhole]];
  const password = form.password || "";
  const isStrong = password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-slate-100">Personal and Account Information</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.slice(0, 4).map(([name, placeholder, icon]) => (
          <Field key={name} icon={icon} name={name} value={form[name] || ""} onChange={update} placeholder={placeholder} />
        ))}
        <label><select name="gender" value={form.gender || ""} onChange={update} className={inputClass}><option value="">Gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
        <Field icon={CalendarDays} name="birthDate" value={form.birthDate || ""} onChange={update} type="date" />
        <Field icon={IdCard} name="contactNumber" value={form.contactNumber || ""} onChange={update} placeholder="Contact Number" />
        <Field icon={Mail} name="email" value={form.email || ""} onChange={update} placeholder="Personal Email Address" type="email" />
        <PasswordField name="password" value={form.password} onChange={update} placeholder="Password" />
        <PasswordField name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Confirm Password" />
      </div>
      {password && <div className="mt-3 flex items-center gap-3 text-xs text-slate-300"><span>Password strength</span><span className={`h-1 flex-1 rounded ${isStrong ? "bg-gradient-to-r from-emerald-400 via-emerald-400 to-emerald-400" : "bg-gradient-to-r from-rose-400 via-rose-400 to-slate-700"}`} /><span className={isStrong ? "text-emerald-300" : "text-rose-300"}>{isStrong ? "Strong" : "Weak"}</span></div>}
    </section>
  );
}

function Verification({ isAssessor, form, update, documents, setDocuments, photoPreview, photoInputKey, choosePhoto, clearPhoto, accepted, setAccepted }) {
  const fields = isAssessor
    ? [["assessorId", "TESDA Assessor ID Number"], ["assessmentCenter", "Assessment Center / Training Institution"], ["specialization", "Qualification / Specialization"], ["experience", "Years of Experience (Optional)"]]
    : [["trainingCenter", "Training Center / TVET Institution"], ["ncLevel", "NC Level"], ["qualification", "Qualification / Course"], ["batch", "Batch (Optional)"]];

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-slate-100">{isAssessor ? "Professional Information" : "Training Information"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([name, label]) => <input key={name} name={name} value={form[name] || ""} onChange={update} className={inputClass} placeholder={label} />)}
      </div>
      
      <h2 className="mb-2 mt-4 text-base font-semibold text-slate-100">Profile Photo</h2>
      <label className="relative flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-cyan-200/70 bg-cyan-300/10 p-4 text-center">
        <input key={photoInputKey} onChange={choosePhoto} type="file" accept="image/jpeg,image/png" className="absolute inset-0 cursor-pointer opacity-0" />
        {photoPreview ? (
          <>
            <img src={photoPreview} alt="Selected profile" className="h-24 w-24 rounded-lg border-2 border-cyan-300 object-cover" />
            <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); clearPhoto(); }} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/40 bg-slate-950/90 text-white shadow-lg hover:bg-rose-500" aria-label="Remove selected profile photo">
              <X size={15} />
            </button>
          </>
        ) : (
          <div>
            <ImagePlus className="mx-auto mb-2 text-cyan-100" />
            <b className="block text-sm">Upload Recent 2×2 Formal ID Photo</b>
            <span className="text-xs text-slate-300">Accepted formats: JPG, PNG · Maximum file size: 5 MB</span>
          </div>
        )}
      </label>

      {isAssessor && (
        <>
          <h2 className="mb-2 mt-4 text-base font-semibold text-slate-100">Supporting Documents</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Document 
              label="TESDA Assessor Accreditation Certificate" 
              required 
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setDocuments((current) => ({ ...current, accreditation: file }));
              }} 
            />
            <Document 
              label="Government-issued ID" 
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setDocuments((current) => ({ ...current, governmentId: file }));
              }} 
            />
          </div>
        </>
      )}

      <label className="mt-3 flex cursor-pointer gap-2 rounded-lg border border-cyan-200/55 bg-slate-900/60 p-3 text-xs leading-4 text-slate-200">
        <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" className="mt-0.5 accent-cyan-400" />
        I certify that all information provided is true and accurate. I understand that my registration will remain in Pending Approval status until verified and approved by the TESDA Administrator.
      </label>

      <div className="mt-3 rounded-lg border border-sky-300/30 bg-sky-300/10 p-3 text-xs text-slate-200">
        <p className="mb-1 font-semibold"><Info className="mr-1 inline text-cyan-300" size={14} />What happens next?</p>
        <ul className="list-inside list-disc space-y-0.5 text-slate-300">
          <li>Your request is submitted to the TESDA Administrator.</li>
          <li>Your account remains in Pending Approval while information is reviewed.</li>
          <li>Once approved, you will receive an email notification.</li>
        </ul>
      </div>
    </section>
  );
}

function Document({ label, required, onChange }) {
  return (
    <label className="rounded-lg border border-dashed border-cyan-200/50 bg-slate-900/50 p-3 text-xs text-slate-200">
      <b className="block">{label} {required && <span className="text-cyan-300">Required</span>}</b>
      <span className="block py-1 text-slate-400">PDF, JPG, or PNG · Maximum 10 MB</span>
      <span className="inline-flex items-center gap-1 text-cyan-200">
        <Upload size={13} /> 
        <input onChange={onChange} type="file" accept="image/jpeg,image/png,application/pdf" className="max-w-44 text-xs" />
      </span>
    </label>
  );
}

function Success({ onLogin }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040814] px-4">
      <AnimatedWave />
      <main className="relative z-10 w-full max-w-xl rounded-[28px] border border-cyan-300/40 bg-slate-950/80 p-8 text-center shadow-[0_0_45px_rgba(34,211,238,.35)] backdrop-blur-[30px]">
        <div className="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">
          NOERION
        </div>
        <h1 className="mt-7 text-center text-3xl font-bold text-white leading-tight">
          Registration Submitted<br />
          <span className="inline-flex items-center gap-2">
            Successfully! <CheckCircle2 size={28} className="text-emerald-400" />
          </span>
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Thank you for registering with NOERION. Your account has been created and is currently pending review by the TESDA Administrator. You will receive an email once your registration is approved.
        </p>
        <div className="mt-5 flex justify-between rounded-lg border border-slate-500/40 bg-slate-800/70 p-3 text-sm text-slate-100">
          <span>Status</span>
          <span className="font-semibold text-amber-300">● Pending Approval</span>
        </div>
        <div className="mt-3 rounded-lg bg-sky-300/10 p-3 text-left text-xs text-slate-300">
          <Info className="mr-1 inline text-cyan-300" size={14} />
          The administrator will verify your registration details before granting access to the system.
        </div>
        <button onClick={onLogin} className="mt-5 w-full rounded-lg bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 py-3 text-sm font-bold text-slate-950">
          Return to Login
        </button>
      </main>
    </div>
  );
}