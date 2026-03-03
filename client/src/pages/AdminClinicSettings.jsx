//client/src/pages/AdminClinicSettings.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { formatName } from "../utils/format";
import { getImageUrl } from "../utils/getImageUrl";
import "../styles/adminpage.css";

export default function AdminClinicSettings() {
  const [settings, setSettings] = useState(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  /* ================= LOAD ================= */

  const loadSettings = async () => {
    const res = await api.get("/clinic/clinic-settings");
    setSettings(res.data);

    setForm({
      name: res.data.name || "",
      address: res.data.address || "",
      phone: res.data.phone || "",
    });

    if (res.data.logo_path) {
      setLogoPreview(
        getImageUrl(`/uploads/${res.data.logo_path}`)
      );
    }

    if (res.data.doctor_signature_path) {
      setSignaturePreview(
        getImageUrl(`/uploads/${res.data.doctor_signature_path}`)
      );
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /* ================= TEXT UPDATE ================= */

  const saveSettings = async () => {
    const formattedData = {
        name: formatName(form.name),
        address: formatName(form.address),
        phone: form.phone,
    };

    await api.put("/clinic/clinic-settings", formattedData);

    alert("Clinic settings updated");

    loadSettings();
    };


  /* ================= FILE UPLOAD ================= */

  const uploadFile = async (file, type) => {
    const data = new FormData();
    data.append(type, file);

    await api.post(
      `/clinic/clinic-settings/${type}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    loadSettings();
  };

  /* ================= RENDER ================= */

  if (!settings) return null;

  return (
    <div className="admin-page">

      {/* ================= TEXT SETTINGS ================= */}
      <div className="admin-canvas">
        <div className="admin-title">Clinic Information</div>

        <input
          className="admin-input"
          placeholder="Clinic Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          className="admin-input"
          placeholder="Address"
          value={form.address}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />

        <input
          className="admin-input"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <button
          className="admin-btn primary"
          onClick={saveSettings}
        >
          Save
        </button>
      </div>

      {/* ================= LOGO ================= */}
        <div className="admin-canvas">
        <div className="admin-title">Clinic Logo</div>

        <div className="image-upload-card">
            {logoPreview ? (
            <img
                src={logoPreview}
                alt="logo"
                className="upload-preview"
            />
            ) : (
            <div className="upload-placeholder">
                No logo uploaded
            </div>
            )}

            <div className="upload-actions">
            <label className="admin-btn secondary">
                {logoPreview ? "Replace Logo" : "Upload Logo"}
                <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                    uploadFile(e.target.files[0], "logo")
                }
                />
            </label>
            </div>
        </div>
        </div>

      {/* ================= SIGNATURE ================= */}
        <div className="admin-canvas">
        <div className="admin-title">Doctor Signature</div>

        <div className="image-upload-card">
            {signaturePreview ? (
            <img
                src={signaturePreview}
                alt="signature"
                className="upload-preview"
            />
            ) : (
            <div className="upload-placeholder">
                No signature uploaded
            </div>
            )}

            <div className="upload-actions">
            <label className="admin-btn secondary">
                {signaturePreview ? "Replace Signature" : "Upload Signature"}
                <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                    uploadFile(e.target.files[0], "signature")
                }
                />
            </label>
            </div>
        </div>
        </div>

    </div>
  );
}
