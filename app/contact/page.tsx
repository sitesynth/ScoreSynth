"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    companySize: "",
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    outline: "none",
    background: "#2a1f1e",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    color: "#a89690",
    marginBottom: "6px",
    display: "block",
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "80px", paddingBottom: "48px", paddingLeft: "32px", paddingRight: "32px", minHeight: "auto" }} className="mob-px">
        <div className="mob-1col mob-gap-sm" style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "64px", alignItems: "start",
          paddingTop: "40px",
        }}>

          {/* Left — title + illustration */}
          <div>
            <h1 style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              lineHeight: 1.1, fontWeight: 400,
              color: "#fff", marginBottom: "16px",
            }}>
              Get in touch
            </h1>
            <p style={{ fontSize: "15px", color: "#a89690", lineHeight: 1.6, marginBottom: "48px" }}>
              Questions, partnerships, or just want to say hi — we&apos;d love to hear from you.
            </p>

            <style>{`
              @keyframes floatClef {
                0%   { transform: translateY(0px) rotate(0deg);   }
                30%  { transform: translateY(-14px) rotate(-2deg); }
                60%  { transform: translateY(-8px) rotate(1.5deg); }
                100% { transform: translateY(0px) rotate(0deg);   }
              }
              @keyframes floatNote {
                0%   { transform: translateY(0px) rotate(0deg);    }
                40%  { transform: translateY(-20px) rotate(5deg);  }
                70%  { transform: translateY(-10px) rotate(-3deg); }
                100% { transform: translateY(0px) rotate(0deg);    }
              }
            `}</style>

            <div style={{ position: "relative", width: "100%", maxWidth: "320px", height: "300px" }}>
              <Image
                src="/assets/contactsales-clef.svg"
                alt="Treble Clef"
                width={429}
                height={398}
                style={{
                  width: "100%", height: "100%", objectFit: "contain", opacity: 0.9,
                  position: "absolute", inset: 0,
                  animation: "floatClef 5.5s ease-in-out infinite",
                }}
              />
              <Image
                src="/assets/contactsales-note.svg"
                alt="Music Note"
                width={429}
                height={398}
                style={{
                  width: "100%", height: "100%", objectFit: "contain", opacity: 0.9,
                  position: "absolute", inset: 0,
                  animation: "floatNote 4s ease-in-out infinite",
                  animationDelay: "0.8s",
                }}
              />
            </div>
          </div>

          {/* Right — form card */}
          <div style={{
            background: "#1e1513",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            padding: "36px",
          }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Row 1: Company size + Company name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Company size *</label>
                  <select
                    value={form.companySize}
                    onChange={e => setForm({ ...form, companySize: e.target.value })}
                    style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a89690' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer" }}
                  >
                    <option value="" disabled>Please select</option>
                    <option value="1-10">1–10</option>
                    <option value="11-50">11–50</option>
                    <option value="51-200">51–200</option>
                    <option value="201+">201+</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Company name *</label>
                  <input
                    type="text"
                    placeholder="Acme Music Inc."
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 2: First + Last name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>First name *</label>
                  <input
                    type="text"
                    placeholder="Michael"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Last name *</label>
                  <input
                    type="text"
                    placeholder="Zimmer"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 3: Email + Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Work email *</label>
                  <input
                    type="email"
                    placeholder="hello@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Phone number *</label>
                  <input
                    type="tel"
                    placeholder="+32 000 000 000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Interest dropdown */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Which of our products or services are you interested in? *</label>
                <select
                  value={form.interest}
                  onChange={e => setForm({ ...form, interest: e.target.value })}
                  style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a89690' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer" }}
                >
                  <option value="" disabled>Please select</option>
                  <option value="transcription">Music Transcription</option>
                  <option value="orchestration">AI Orchestration</option>
                  <option value="api">API Integration</option>
                  <option value="community">Community / Sheet Music</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>

              {/* Message */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Can you share more about your business needs and challenges?</label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your project..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                />
              </div>

              {/* Submit */}
              {status === "sent" ? (
                <div style={{
                  textAlign: "center", padding: "14px",
                  borderRadius: "10px", background: "rgba(39,174,96,0.12)",
                  border: "1px solid rgba(39,174,96,0.3)",
                  color: "#5dce8a", fontSize: "14px", fontWeight: 500,
                }}>
                  ✓ Message sent — we&apos;ll get back to you soon!
                </div>
              ) : (
                <>
                  {status === "error" && (
                    <p style={{ fontSize: "12px", color: "#e87060", textAlign: "center", margin: 0 }}>
                      Something went wrong. Please email us at support@scoresynth.com
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    style={{
                      width: "100%", padding: "13px",
                      borderRadius: "10px",
                      fontSize: "13px", fontWeight: 600,
                      background: "#fff", color: "#211817",
                      cursor: status === "sending" ? "default" : "pointer",
                      border: "none",
                      transition: "opacity 0.15s",
                      opacity: status === "sending" ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (status !== "sending") e.currentTarget.style.opacity = "0.88"; }}
                    onMouseLeave={e => { if (status !== "sending") e.currentTarget.style.opacity = "1"; }}
                  >
                    {status === "sending" ? "Sending…" : "Send message"}
                  </button>
                </>
              )}

            </form>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
