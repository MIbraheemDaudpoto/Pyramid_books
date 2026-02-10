import { useState, useEffect } from "react";
import { useMe } from "@/hooks/use-me";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { User, Building2, GraduationCap, Lock, Save, Eye, EyeOff } from "lucide-react";

export default function StoreProfile() {
  const { data: me, isLoading: meLoading } = useMe();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileType, setProfileType] = useState("individual");
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [address, setAddress] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (me) {
      setFirstName(me.firstName ?? "");
      setLastName(me.lastName ?? "");
      setEmail(me.email ?? "");
      setPhone(me.phone ?? "");
      setProfileType(me.profileType ?? "individual");
      setCompanyName(me.companyName ?? "");
      setTaxNumber(me.taxNumber ?? "");
      setAddress(me.address ?? "");
    }
  }, [me]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess("");
    setProfileError("");
    try {
      await apiRequest("PATCH", "/api/profile", {
        firstName,
        lastName,
        phone,
        profileType,
        companyName: profileType !== "individual" ? companyName : "",
        taxNumber: profileType !== "individual" ? taxNumber : "",
        address: profileType !== "individual" ? address : "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setProfileSuccess("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordSaving(false);
      return;
    }

    try {
      await apiRequest("PATCH", "/api/profile/password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (meLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const profileTypes = [
    { key: "individual", label: "Individual", icon: User, testId: "profile-type-individual" },
    { key: "school", label: "School/Institution", icon: GraduationCap, testId: "profile-type-school" },
    { key: "company", label: "Company/Organization", icon: Building2, testId: "profile-type-company" },
  ];

  return (
    <div>
      <SectionHeader title="My Profile" subtitle="Manage your account information" />

      <form onSubmit={handleSaveProfile}>
        <GlassCard className="mb-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <User style={{ width: 20, height: 20 }} />
            Personal Information
          </h5>

          {profileSuccess && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {profileSuccess}
              <button type="button" className="btn-close" onClick={() => setProfileSuccess("")} />
            </div>
          )}
          {profileError && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {profileError}
              <button type="button" className="btn-close" onClick={() => setProfileError("")} />
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-first-name"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="input-last-name"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                readOnly
                disabled
                data-testid="input-email"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="mb-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <Building2 style={{ width: 20, height: 20 }} />
            Profile Type
          </h5>

          <div className="row g-3 mb-3">
            {profileTypes.map((pt) => {
              const Icon = pt.icon;
              const isSelected = profileType === pt.key;
              return (
                <div key={pt.key} className="col-md-4">
                  <div
                    className={`pb-glass rounded-4 p-3 text-center cursor-pointer border border-2 ${
                      isSelected ? "border-primary" : "border-transparent"
                    }`}
                    style={{ cursor: "pointer", transition: "border-color 0.2s" }}
                    onClick={() => setProfileType(pt.key)}
                    data-testid={pt.testId}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setProfileType(pt.key); }}
                  >
                    <div
                      className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-2 ${
                        isSelected ? "bg-primary text-white" : "bg-primary bg-opacity-10 text-primary"
                      }`}
                      style={{ width: 48, height: 48 }}
                    >
                      <Icon style={{ width: 24, height: 24 }} />
                    </div>
                    <div className={`fw-semibold ${isSelected ? "text-primary" : ""}`}>{pt.label}</div>
                    {isSelected && (
                      <div className="badge bg-primary mt-2">Selected</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(profileType === "school" || profileType === "company") && (
            <div className="row g-3 pb-enter">
              <div className="col-md-6">
                <label className="form-label">
                  {profileType === "school" ? "School Name" : "Company Name"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  data-testid="input-company-name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Tax Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  data-testid="input-tax-number"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  data-testid="input-address"
                />
              </div>
            </div>
          )}
        </GlassCard>

        <div className="mb-4">
          <button
            type="submit"
            className="btn btn-primary pb-sheen d-flex align-items-center gap-2"
            disabled={profileSaving}
            data-testid="button-save-profile"
          >
            {profileSaving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                Saving...
              </>
            ) : (
              <>
                <Save style={{ width: 16, height: 16 }} />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>

      <GlassCard className="mb-4">
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <Lock style={{ width: 20, height: 20 }} />
          Change Password
        </h5>

        {passwordSuccess && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {passwordSuccess}
            <button type="button" className="btn-close" onClick={() => setPasswordSuccess("")} />
          </div>
        )}
        {passwordError && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {passwordError}
            <button type="button" className="btn-close" onClick={() => setPasswordError("")} />
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Current Password</label>
              <div className="input-group">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
          </div>
          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <label className="form-label">New Password</label>
              <div className="input-group">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Confirm New Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  data-testid="input-confirm-new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <button
              type="submit"
              className="btn btn-primary pb-sheen d-flex align-items-center gap-2"
              disabled={passwordSaving}
              data-testid="button-change-password"
            >
              {passwordSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock style={{ width: 16, height: 16 }} />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
