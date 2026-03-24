"use client";

import { useState } from "react";

type Tab = "billing" | "plan" | "invoices";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: "36px", height: "20px", borderRadius: "10px", flexShrink: 0,
        background: on ? "#c0392b" : "rgba(255,255,255,0.12)",
        cursor: "pointer", position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
        position: "absolute", top: "3px",
        left: on ? "19px" : "3px",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

function SubModal({ title, onClose, children, width = 380 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
      <div style={{
        background: "#2a1f1e", borderRadius: "12px",
        width: `${width}px`, maxWidth: "90vw", padding: "24px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
        maxHeight: "80vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8" }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b5452" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  background: "#1e1513", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = { fontSize: "11px", color: "#6b5452", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" };

export default function AdminModal({ activeTab, onTabChange, onClose }: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onClose: () => void;
}) {
  // Billing sub-modals
  const [vatModal, setVatModal] = useState(false);
  const [vatId, setVatId] = useState("BE1022394648");
  const [paymentModal, setPaymentModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [contactsModal, setContactsModal] = useState(false);

  // Invoice fields
  const [invoiceData, setInvoiceData] = useState({ company: "ScoreSynth BV", vat: "BE1022394648", address: "Rue de la Loi 10", city: "Brussels", country: "Belgium" });

  // Billing contacts
  const [billingEmails, setBillingEmails] = useState(["billing@scoresynth.com"]);
  const [newEmail, setNewEmail] = useState("");

  // Plan
  const [currentPlan, setCurrentPlan] = useState("Pro");
  const [switchModal, setSwitchModal] = useState<string | null>(null);

  // Security

  const tabs: Tab[] = ["billing", "plan", "invoices"];

  const plans = [
    { name: "Free", price: "€0",  features: ["5 AI generations/mo",  "Editor: 1 project / 1 page",            "Basic orchestrations", "PDF export"] },
    { name: "Solo", price: "€19", features: ["25 AI generations/mo", "Editor: unlimited projects & pieces",   "All orchestrations",   "PDF + XML export"] },
    { name: "Pro",  price: "€49", features: ["50 AI generations/mo", "Editor: unlimited projects & pieces",   "3 seats (+€20/extra)", "All export formats",  "Priority processing", "API access"] },
  ];

  const rowStyle: React.CSSProperties = { padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#1e1513", borderRadius: "16px",
        width: "700px", maxWidth: "94vw", maxHeight: "88vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Tabs + close */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
        }}>
          <div style={{ display: "flex" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => onTabChange(t)} style={{
                padding: "14px 16px", fontSize: "13px", fontWeight: activeTab === t ? 500 : 400,
                color: activeTab === t ? "#fff" : "#6b5452",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: activeTab === t ? "2px solid #c0392b" : "2px solid transparent",
                transition: "color 0.15s", textTransform: "capitalize",
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#6b5452", padding: "4px", borderRadius: "6px",
            display: "flex", alignItems: "center", transition: "color 0.15s",
            marginRight: "-8px",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b5452")}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* ── BILLING ── */}
          {activeTab === "billing" && (
            <div style={{ padding: "28px" }}>
              <div style={{ padding: "14px 16px", background: "#2a1f1e", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "24px" }}>
                <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6 }}>
                  Your monthly subscription renews on <strong style={{ color: "#e8dbd8" }}>February 25, 2026</strong> and your annual subscription renews on <strong style={{ color: "#e8dbd8" }}>May 25, 2026</strong>. We'll notify you beforehand.
                </p>
              </div>
              {[
                { label: "Payment details", desc: "Visa ending in 4242", action: "Update", onClick: () => setPaymentModal(true) },
                { label: "Invoice details", desc: invoiceData.company, action: "Edit", onClick: () => setInvoiceModal(true) },
                { label: "Value Added Tax / GST", desc: vatId || "Not set", action: "Update", onClick: () => setVatModal(true) },
                { label: "Billing contacts", desc: `${billingEmails.length} contact${billingEmails.length !== 1 ? "s" : ""}`, action: "Manage", onClick: () => setContactsModal(true) },
              ].map(item => (
                <div key={item.label} style={rowStyle}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "3px" }}>{item.label}</p>
                      <p style={{ fontSize: "12px", color: "#6b5452" }}>{item.desc}</p>
                    </div>
                    <button onClick={item.onClick} style={{
                      padding: "6px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer",
                      background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#e8dbd8",
                    }}>
                      {item.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PLAN ── */}
          {activeTab === "plan" && (
            <div style={{ padding: "28px" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "6px" }}>Change your plan</p>
              <p style={{ fontSize: "13px", color: "#6b5452", marginBottom: "20px" }}>Currently on <strong style={{ color: "#c0392b" }}>{currentPlan}</strong></p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                {plans.map(plan => {
                  const isCurrent = plan.name === currentPlan;
                  return (
                    <div key={plan.name} style={{
                      background: "#2a1f1e", borderRadius: "12px",
                      border: `1px solid ${isCurrent ? "#c0392b" : "rgba(255,255,255,0.07)"}`,
                      padding: "20px",
                    }}>
                      <p style={{ fontSize: "16px", fontFamily: "Georgia, serif", color: "#fff", marginBottom: "4px" }}>{plan.name}</p>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "3px", marginBottom: "14px" }}>
                        <span style={{ fontSize: "22px", fontWeight: 600, color: "#fff" }}>{plan.price}</span>
                        <span style={{ fontSize: "12px", color: "#6b5452" }}>/ month</span>
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {plan.features.map(f => (
                          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "7px", fontSize: "12px", color: "#a89690" }}>
                            <svg style={{ flexShrink: 0, marginTop: "2px" }} width="12" height="12" fill="none" stroke={isCurrent ? "#c0392b" : "currentColor"} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={!isCurrent ? () => setSwitchModal(plan.name) : undefined}
                        style={{
                          width: "100%", padding: "8px", borderRadius: "8px",
                          background: isCurrent ? "#c0392b" : "transparent",
                          border: `1px solid ${isCurrent ? "#c0392b" : "rgba(255,255,255,0.12)"}`,
                          color: "#fff", fontSize: "12px", fontWeight: 500,
                          cursor: isCurrent ? "default" : "pointer",
                        }}
                      >
                        {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ── Top up generations (Solo / Pro only) ── */}
              {(currentPlan === "Solo" || currentPlan === "Pro") && (
                <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "4px" }}>Top up generations</p>
                  <p style={{ fontSize: "12px", color: "#6b5452", marginBottom: "16px" }}>Buy extra generations for this month.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { name: "Starter",  count: 10,  price: "€4.90",  note: "€0.49 / gen" },
                      { name: "Standard", count: 50,  price: "€19.90", note: "€0.40 / gen" },
                      { name: "Pro Pack", count: 100, price: "€34.90", note: "€0.35 / gen", badge: "Best value" },
                    ].map(pkg => (
                      <div key={pkg.name} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: "10px",
                        background: "#1e1513", border: "1px solid rgba(255,255,255,0.06)",
                        gap: "12px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                          <span style={{ fontSize: "13px", color: "#e8dbd8", fontWeight: 500 }}>{pkg.name}</span>
                          {"badge" in pkg && (
                            <span style={{ fontSize: "10px", color: "#c0392b", background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.2)", padding: "1px 7px", borderRadius: "20px", fontWeight: 600 }}>
                              {pkg.badge}
                            </span>
                          )}
                          <span style={{ fontSize: "11px", color: "#6b5452" }}>{pkg.count} gen</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#6b5452", whiteSpace: "nowrap" }}>{pkg.note}</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>{pkg.price}</span>
                        <button style={{
                          padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                          background: "#fff", border: "none", color: "#211817", cursor: "pointer",
                          transition: "opacity 0.15s", whiteSpace: "nowrap",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                        >
                          Buy
                        </button>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: "12px", fontSize: "11px", color: "#6b5452" }}>
                    Works with: Score generation · Transcription · Orchestration · MIDI export
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── INVOICES ── */}
          {activeTab === "invoices" && (
            <div style={{ padding: "28px" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8dbd8", marginBottom: "6px" }}>Invoices</p>
              <p style={{ fontSize: "13px", color: "#6b5452", marginBottom: "20px" }}>Download PDF invoices for all your past payments.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {[
                  { date: "Feb 25, 2026", amount: "€49.00", plan: "Pro — Monthly", id: "INV-2026-002" },
                  { date: "Jan 25, 2026", amount: "€49.00", plan: "Pro — Monthly", id: "INV-2026-001" },
                  { date: "Dec 25, 2025", amount: "€49.00", plan: "Pro — Monthly", id: "INV-2025-012" },
                  { date: "Nov 25, 2025", amount: "€49.00", plan: "Pro — Monthly", id: "INV-2025-011" },
                  { date: "Oct 25, 2025", amount: "€49.00", plan: "Pro — Monthly", id: "INV-2025-010" },
                  { date: "May 25, 2025", amount: "€470.00", plan: "Pro — Annual", id: "INV-2025-005" },
                ].map((inv, i) => (
                  <div key={inv.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: "8px",
                    background: i % 2 === 0 ? "#2a1f1e" : "transparent",
                    border: "1px solid transparent",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#2a1f1e"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? "#2a1f1e" : "transparent"; (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" fill="none" stroke="#a89690" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", color: "#e8dbd8", marginBottom: "2px" }}>{inv.plan}</p>
                        <p style={{ fontSize: "11px", color: "#6b5452" }}>{inv.date} · {inv.id}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#e8dbd8" }}>{inv.amount}</span>
                      <button
                        onClick={() => alert(`Downloading ${inv.id}.pdf`)}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "5px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer",
                          background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690",
                          transition: "color 0.15s, border-color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#a89690"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── VAT sub-modal ── */}
      {vatModal && (
        <SubModal title="Add an identification number" onClose={() => setVatModal(false)}>
          <p style={{ fontSize: "12px", color: "#a89690", lineHeight: 1.6, marginBottom: "16px" }}>
            If you are paying for ScoreSynth as a business, enter your full Value Added Tax (VAT) or Goods and Services Tax (GST) identification number.
          </p>
          <label style={labelStyle}>VAT / GST ID</label>
          <input type="text" value={vatId} onChange={e => setVatId(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => setVatModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setVatModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Save</button>
          </div>
        </SubModal>
      )}

      {/* ── Payment method sub-modal ── */}
      {paymentModal && (
        <SubModal title="Update payment method" onClose={() => setPaymentModal(false)}>
          <p style={{ fontSize: "12px", color: "#a89690", marginBottom: "16px" }}>Your current card: Visa ending in 4242</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Card number</label>
              <input type="text" placeholder="•••• •••• •••• ••••" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Expiry</label>
                <input type="text" placeholder="MM / YY" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CVC</label>
                <input type="text" placeholder="•••" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Name on card</label>
              <input type="text" placeholder="Full name" style={inputStyle} />
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "#6b5452", marginTop: "12px", lineHeight: 1.5 }}>
            Payment processing is handled securely. Card details are not stored on our servers.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => setPaymentModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setPaymentModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Save</button>
          </div>
        </SubModal>
      )}

      {/* ── Invoice details sub-modal ── */}
      {invoiceModal && (
        <SubModal title="Invoice details" onClose={() => setInvoiceModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {([
              ["company", "Company name"],
              ["vat", "VAT number"],
              ["address", "Address"],
              ["city", "City"],
              ["country", "Country"],
            ] as [keyof typeof invoiceData, string][]).map(([key, label]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="text" value={invoiceData[key]}
                  onChange={e => setInvoiceData(d => ({ ...d, [key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => setInvoiceModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setInvoiceModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Save</button>
          </div>
        </SubModal>
      )}

      {/* ── Billing contacts sub-modal ── */}
      {contactsModal && (
        <SubModal title="Billing contacts" onClose={() => setContactsModal(false)}>
          <p style={{ fontSize: "12px", color: "#a89690", marginBottom: "14px" }}>These email addresses receive billing receipts and notifications.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {billingEmails.map(email => (
              <div key={email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#1e1513", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "13px", color: "#e8dbd8" }}>{email}</span>
                <button
                  onClick={() => setBillingEmails(es => es.filter(e => e !== email))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#6b5452", padding: "2px" }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="Add email address"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={e => {
                if (e.key === "Enter" && newEmail.trim()) {
                  setBillingEmails(es => [...es, newEmail.trim()]);
                  setNewEmail("");
                }
              }}
            />
            <button
              onClick={() => { if (newEmail.trim()) { setBillingEmails(es => [...es, newEmail.trim()]); setNewEmail(""); } }}
              style={{ padding: "5px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Add
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <button onClick={() => setContactsModal(false)} style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Done</button>
          </div>
        </SubModal>
      )}

      {/* ── Switch plan confirmation ── */}
      {switchModal && (
        <SubModal title={`Switch to ${switchModal}`} onClose={() => setSwitchModal(null)}>
          <p style={{ fontSize: "13px", color: "#a89690", lineHeight: 1.6, marginBottom: "16px" }}>
            {switchModal === "Free"
              ? "Switching to Free will immediately remove access to advanced features and your quota will be reduced to 5 AI generations/month."
              : `Switching to ${switchModal} will update your billing at your next renewal date.`}
          </p>
          <div style={{ padding: "12px 14px", background: "#1e1513", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "#6b5452" }}>
              {switchModal === "Free" ? "New plan: Free — €0/month" : `New plan: ${switchModal} — ${switchModal === "Solo" ? "€19" : "€49"}/month`}
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button onClick={() => setSwitchModal(null)} style={{ padding: "7px 16px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#a89690", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={() => { setCurrentPlan(switchModal); setSwitchModal(null); }}
              style={{ padding: "7px 16px", borderRadius: "8px", background: "#c0392b", border: "none", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              Confirm switch
            </button>
          </div>
        </SubModal>
      )}

    </div>
  );
}
