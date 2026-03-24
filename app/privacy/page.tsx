import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, upload audio files, or contact us for support. This includes your name, email address, payment information, and any audio, MIDI, or sheet music files you upload to the platform. We also automatically collect certain technical information when you use ScoreSynth, including your IP address, browser type, operating system, pages visited, and usage patterns.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use the information we collect to provide, maintain, and improve ScoreSynth's AI transcription and orchestration services. This includes processing your uploaded files to generate musical scores, sending you transactional emails (receipts, account confirmations), personalizing your experience, and communicating updates or promotional offers if you have opted in. We may also use aggregated, anonymized data to train and improve our AI models.`,
  },
  {
    title: "Sharing Your Information",
    content: `We do not sell your personal information. We may share your information with trusted third-party service providers who assist us in operating our platform (such as payment processors, cloud infrastructure providers, and analytics services), subject to confidentiality agreements. We may also disclose information if required by law, to protect the rights or safety of ScoreSynth or others, or in connection with a merger, acquisition, or sale of assets.`,
  },
  {
    title: "Data Retention",
    content: `We retain your personal data for as long as your account is active or as needed to provide you services. Uploaded audio files and generated scores are retained for the duration of your subscription plus 30 days after cancellation. You may request deletion of your data at any time by contacting us at privacy@scoresynth.com. We will respond to deletion requests within 30 days.`,
  },
  {
    title: "Your Rights",
    content: `Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, or delete your data, the right to object to or restrict processing, and the right to data portability. To exercise these rights, please contact us at privacy@scoresynth.com. EU and UK residents have additional rights under GDPR and UK GDPR respectively.`,
  },
  {
    title: "Cookies",
    content: `ScoreSynth uses cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze how our service is used. Essential cookies are required for the platform to function. Analytics and marketing cookies are optional and can be disabled through your browser settings or our cookie preference center. We do not use third-party advertising cookies.`,
  },
  {
    title: "Security",
    content: `We implement industry-standard security measures to protect your information, including TLS encryption for data in transit and AES-256 encryption for data at rest. Access to personal data is restricted to employees who need it to perform their job functions. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "Contact Us",
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:\n\nScoreSynth\nEmail: privacy@scoresynth.com\nAddress: Meir 67, Oppuurs, Belgium`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "96px", paddingLeft: "32px", paddingRight: "32px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          {/* Header */}
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "3rem", lineHeight: 1.1, marginBottom: "12px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "14px", color: "#a89690", marginBottom: "56px" }}>
            Last updated: March 1, 2026
          </p>

          <p style={{ fontSize: "15px", color: "#a89690", lineHeight: 1.8, marginBottom: "48px" }}>
            At ScoreSynth, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered music transcription and orchestration platform. Please read this policy carefully. If you disagree with its terms, please discontinue use of our service.
          </p>

          {/* Sections */}
          {sections.map((section, i) => (
            <div
              key={i}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "32px",
                paddingBottom: "32px",
              }}
            >
              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: "#fff",
                }}
              >
                {i + 1}. {section.title}
              </h2>
              <p style={{ fontSize: "14px", color: "#a89690", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
