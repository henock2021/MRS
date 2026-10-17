"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trees,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  HeartHandshake,
  ShieldAlert,
  AlertCircle,
  Upload,
  Check,
  Compass,
  Binoculars,
  Shovel,
  Sparkles,
  Tent,
  Camera,
  GraduationCap,
  Info,
  Loader2,
} from "lucide-react";
import { INTEREST_AREAS, calculateAge } from "@/lib/validations";

interface MembershipTypeOption {
  id: string;
  name: string;
  fee: number;
  durationDays: number;
  description: string | null;
}

const interestIcons: Record<string, React.ElementType> = {
  hiking: Compass,
  "bird watching": Binoculars,
  "tree planting": Shovel,
  "clean-up": Sparkles,
  camping: Tent,
  photography: Camera,
  education: GraduationCap,
};

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Membership types state fetched from API
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeOption[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [membershipTypeId, setMembershipTypeId] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "hiking",
    "tree planting",
  ]);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Minor Under-18 State
  const [isUnder18, setIsUnder18] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianConsent, setGuardianConsent] = useState(false);

  // Agreements State
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [liabilityWaiver, setLiabilityWaiver] = useState(false);

  // Error feedback state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // 1. Fetch available membership tiers on mount
  useEffect(() => {
    async function loadTiers() {
      try {
        const res = await fetch("/api/register", { cache: "no-store" });
        const json = await res.json();
        if (json.membershipTypes && json.membershipTypes.length > 0) {
          setMembershipTypes(json.membershipTypes);
          // Keep current selection if it exists in the active tiers, otherwise select Adult or first tier
          setMembershipTypeId((currentId) => {
            const exists = json.membershipTypes.some(
              (t: MembershipTypeOption) => t.id === currentId
            );
            if (exists && currentId) return currentId;
            const defaultTier =
              json.membershipTypes.find((t: MembershipTypeOption) => t.name === "Adult") ||
              json.membershipTypes[0];
            return defaultTier.id;
          });
        }
      } catch (err) {
        console.error("Failed to load membership types:", err);
      } finally {
        setLoadingTiers(false);
      }
    }
    loadTiers();
  }, []);

  // 2. Reactively check if applicant is under 18 whenever dateOfBirth changes
  useEffect(() => {
    if (!dateOfBirth) {
      setIsUnder18(false);
      return;
    }
    const age = calculateAge(dateOfBirth);
    const under18 = age < 18;
    setIsUnder18(under18);

    // If applicant is under 18 and a student tier is available, suggest or switch
    if (under18 && membershipTypes.length > 0) {
      const studentTier = membershipTypes.find((t) => t.name.toLowerCase().includes("student"));
      if (studentTier && membershipTypeId !== studentTier.id) {
        setMembershipTypeId(studentTier.id);
      }
    }
  }, [dateOfBirth, membershipTypes]);

  // Handle Interest Areas toggle
  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((item) => item !== id));
      }
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  // Handle Photo File Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Please select a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Photo size exceeds 2MB limit. Please choose a smaller photo.");
      return;
    }

    setUploadingPhoto(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }
      setPhotoUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side quick checks
    if (!agreedToRules) {
      setErrorMessage("You must agree to the club rules to submit your registration.");
      return;
    }
    if (!liabilityWaiver) {
      setErrorMessage("You must acknowledge the safety and liability waiver.");
      return;
    }
    if (isUnder18 && !guardianConsent) {
      setErrorMessage("Parental / guardian consent is mandatory for applicants under 18.");
      return;
    }

    // Ensure membership tier is populated
    let selectedTier = membershipTypeId;
    if (!selectedTier && membershipTypes.length > 0) {
      const defaultTier =
        membershipTypes.find((t) => t.name === "Adult") || membershipTypes[0];
      selectedTier = defaultTier.id;
    }

    const payload = {
      fullName,
      email,
      phone,
      address,
      dateOfBirth,
      gender: gender || null,
      occupation,
      membershipTypeId: selectedTier,
      interestAreas: selectedInterests,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      healthNotes: healthNotes || null,
      photoUrl: photoUrl || null,
      guardianName: isUnder18 ? guardianName : null,
      guardianPhone: isUnder18 ? guardianPhone : null,
      guardianConsent: isUnder18 ? guardianConsent : false,
      agreedToRules,
      liabilityWaiver,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
          setErrorMessage(result.error || "An error occurred during registration.");
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        // Redirect to confirmation page with assigned Member Code
        router.push(
          `/register/confirmation?code=${encodeURIComponent(
            result.memberCode
          )}&name=${encodeURIComponent(result.fullName)}&email=${encodeURIComponent(
            result.email
          )}&type=${encodeURIComponent(result.membershipTypeName || "Standard")}`
        );
      } catch (err) {
        setErrorMessage("Network error. Please check your connection and try again.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Page Title & Welcome */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <Trees className="w-4 h-4 text-emerald-700" />
          <span>Nature Club Membership Application</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Join Our Nature Community
        </h1>
        <p className="text-stone-600 text-sm">
          Complete the form below to register. Your application starts with status <strong>Pending</strong> and
          will be reviewed by our club wardens within 24 to 48 hours.
        </p>
      </div>

      {/* Global Error Alert Banner */}
      {errorMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold">Registration Notice</h4>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Personal Details */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">1. Personal Information</h2>
              <p className="text-xs text-stone-500">Your official details for club membership records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {fieldErrors.fullName && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName[0]}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0123"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">Used for SMS outing alerts</span>
              {fieldErrors.phone && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone[0]}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {fieldErrors.dateOfBirth && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.dateOfBirth[0]}</p>
              )}
            </div>

            {/* Residential Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Residential Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, Region"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {fieldErrors.address && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.address[0]}</p>
              )}
            </div>

            {/* Gender (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Gender <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Occupation or School */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Occupation or School <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Wildlife Biologist or High School Student"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {fieldErrors.occupation && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.occupation[0]}</p>
              )}
            </div>

            {/* Optional Profile Photo */}
            <div className="md:col-span-2 pt-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Member Profile Photo <span className="text-stone-400 font-normal">(Optional - JPG, PNG or WebP, max 2MB)</span>
              </label>
              <div className="flex items-center gap-4">
                {photoUrl ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-400">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="text-xs text-stone-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {uploadingPhoto && (
                    <p className="text-xs text-emerald-700 flex items-center gap-1.5 mt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading photo...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Dynamic Minor / Guardian Consent (Revealed if Date of Birth < 18) */}
        {isUnder18 && (
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 space-y-5 animate-fade-in">
            <div className="flex items-center gap-2.5 pb-3 border-b border-amber-200">
              <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-950">
                  Applicant is under 18 — Parental / Guardian Consent Required
                </h2>
                <p className="text-xs text-amber-800">
                  As part of our youth safety protocol, applicants under 18 must provide parent or legal guardian details.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-amber-950 mb-1.5">
                  Parent or Legal Guardian Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required={isUnder18}
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Robert Greenwood"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                {fieldErrors.guardianName && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.guardianName[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-950 mb-1.5">
                  Parent or Guardian Phone Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required={isUnder18}
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="+1 555-0199"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                {fieldErrors.guardianPhone && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.guardianPhone[0]}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required={isUnder18}
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <span className="text-xs text-amber-950 leading-relaxed">
                  <strong>Parental / Guardian Consent Acknowledgment:</strong> I, as the parent or legal guardian,
                  consent to this minor joining Nature Club activities and certify that all details provided are accurate.
                </span>
              </label>
              {fieldErrors.guardianConsent && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.guardianConsent[0]}</p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: Membership Tier Selection */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">2. Select Membership Tier</h2>
              <p className="text-xs text-stone-500">Choose the membership level that suits you</p>
            </div>
          </div>

          {loadingTiers ? (
            <div className="py-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              Loading membership tiers...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {membershipTypes.map((tier) => {
                const isSelected = membershipTypeId === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setMembershipTypeId(tier.id)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500 shadow-sm"
                        : "border-stone-200 hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-stone-900">{tier.name}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="text-xl font-extrabold text-emerald-800 mb-1">
                      ${tier.fee}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2">
                      {tier.description || `${tier.durationDays} days access`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Interest Areas */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">3. Interest Areas</h2>
              <p className="text-xs text-stone-500">Select the outdoor activities you want to participate in</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {INTEREST_AREAS.map((interest) => {
              const isSelected = selectedInterests.includes(interest.id);
              const Icon = interestIcons[interest.id] || Trees;
              return (
                <button
                  type="button"
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500 shadow-sm"
                      : "border-stone-200 hover:border-emerald-200 text-stone-700 bg-white"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{interest.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
          {selectedInterests.length === 0 && (
            <p className="text-xs text-rose-600">Please choose at least one activity.</p>
          )}
        </div>

        {/* SECTION 4: Emergency Contact & Health Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">4. Emergency Contact & Health Notes</h2>
              <p className="text-xs text-stone-500">Kept strictly confidential; accessed only during trips for safety</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Emergency Contact Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="e.g. David Greenwood (Spouse / Parent)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {fieldErrors.emergencyContactName && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.emergencyContactName[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Emergency Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+1 555-0102"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {fieldErrors.emergencyContactPhone && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.emergencyContactPhone[0]}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Health Notes, Allergies, or Medical Considerations <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                placeholder="e.g. Bee sting allergy (carries EpiPen), asthma, dietary requirements, or joint limitations."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                🔒 Protected Health Information: Visible solely to certified trip coordinators and emergency personnel.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5: Club Rules & Liability Acknowledgement */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">5. Agreements & Safety Acknowledgements</h2>
              <p className="text-xs text-stone-500">Required before joining any club activities</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-stone-700 leading-relaxed">
                I agree to abide by the <strong>Nature Club Rules</strong> and Leave No Trace environmental principles.{" "}
                <Link
                  href="/rules"
                  target="_blank"
                  className="text-emerald-700 hover:text-emerald-900 underline font-semibold"
                >
                  (Read Rules & Principles ↗)
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={liabilityWaiver}
                onChange={(e) => setLiabilityWaiver(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-stone-700 leading-relaxed">
                I acknowledge the <strong>Safety Protocol & Liability Waiver</strong>, acknowledging the inherent
                physical risks of outdoor activities and agreeing to follow trip leader instructions.{" "}
                <Link
                  href="/rules"
                  target="_blank"
                  className="text-emerald-700 hover:text-emerald-900 underline font-semibold"
                >
                  (Read Safety Waiver ↗)
                </Link>
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-300 text-white font-bold text-base shadow-lg shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Registration...</span>
              </>
            ) : (
              <>
                <span>Submit Membership Application</span>
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-xs text-stone-500 mt-3">
            By clicking submit, your application is created with status <strong>Pending</strong>.
          </p>
        </div>
      </form>
    </div>
  );
}
