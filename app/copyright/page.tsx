import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "Our Commitment to Copyright",
    content: `SiteSynth respects intellectual property rights and expects users of ScoreSynth to do the same. ScoreSynth operates as a technical hosting platform and does not screen or review content before it is uploaded. We respond promptly to valid notices of copyright infringement submitted in accordance with this policy.

If you believe that content available on ScoreSynth infringes your copyright or the copyright of someone you are authorized to represent, you may submit a takedown notice to our designated copyright agent at the contact details below.`,
  },
  {
    title: "How to Submit a Copyright Takedown Notice",
    content: `To submit a valid copyright takedown notice, please send a written communication to:\n\nEmail: copyright@scoresynth.com\nSubject line: Copyright Takedown Notice\n\nYour notice must include all of the following elements to be considered valid:\n\n1. Identification of the copyrighted work — A description of the copyrighted work you claim has been infringed, or, if multiple works are covered by a single notice, a representative list of those works.\n\n2. Identification of the infringing material — A description of the material you claim is infringing and that you want removed or disabled, with sufficient detail to allow us to locate it on the Platform (e.g., the URL of the specific page).\n\n3. Your contact information — Your full legal name, mailing address, telephone number, and email address.\n\n4. Statement of good faith belief — A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.\n\n5. Statement of accuracy — A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or are authorized to act on behalf of the copyright owner.\n\n6. Signature — Your physical or electronic signature.\n\nIncomplete notices that do not satisfy all of the above requirements may not be acted upon. Submitting a false or misleading takedown notice may expose you to legal liability.`,
  },
  {
    title: "Our Response to Valid Takedown Notices",
    content: `Upon receipt of a complete and valid takedown notice, SiteSynth will:\n\n— Promptly remove or disable access to the allegedly infringing content;\n— Notify the user who uploaded the content that it has been removed and provide them with a copy of the takedown notice (with your personal contact information redacted where appropriate);\n— Inform the uploader of their right to submit a counter-notice.\n\nWe aim to process valid takedown notices within a reasonable timeframe. SiteSynth reserves the right to take no action in response to notices that do not meet the requirements set out above.`,
  },
  {
    title: "Counter-Notice Process",
    content: `If you are the user whose content was removed and you believe the removal was the result of a mistake or misidentification of the material, you may submit a counter-notice.\n\nTo submit a counter-notice, send a written communication to copyright@scoresynth.com containing all of the following:\n\n1. Identification of the removed material — A description of the material that was removed and the location where it appeared before removal (e.g., the URL).\n\n2. Statement under penalty of perjury — A statement that you have a good faith belief that the material was removed as a result of a mistake or misidentification.\n\n3. Consent to jurisdiction — A statement that you consent to the jurisdiction of the Federal Courts in Belgium (or the courts of your EU member state of residence if applicable), and that you will accept service of process from the person who submitted the original takedown notice.\n\n4. Your contact information — Your full legal name, mailing address, telephone number, and email address.\n\n5. Signature — Your physical or electronic signature.\n\nUpon receipt of a valid counter-notice, SiteSynth will forward a copy to the original complainant. If the complainant does not notify us within ten (10) business days that they have filed a court action seeking an order restraining the re-posting of the material, we may restore the removed content at our discretion.`,
  },
  {
    title: "Repeat Infringer Policy",
    content: `In accordance with applicable law and SiteSynth's commitment to copyright protection, SiteSynth has adopted a policy of terminating, in appropriate circumstances, the accounts of users who are determined to be repeat infringers.\n\nA "repeat infringer" is a user who has had content removed from the Platform on two or more separate occasions in response to valid copyright takedown notices. SiteSynth may, in its sole discretion, permanently suspend or terminate the account of any repeat infringer, and may take additional measures including blocking access to the Platform.\n\nSiteSynth also reserves the right to terminate the account of any user who, in its reasonable judgment, has uploaded clearly infringing content, even if only a single incident has occurred.`,
  },
  {
    title: "Abuse of This Process",
    content: `Misuse of the takedown process — including submitting notices that knowingly misrepresent that material is infringing — is prohibited and may result in legal liability. Similarly, submitting a counter-notice that contains false information may expose you to legal consequences. If you are unsure whether content you wish to report constitutes copyright infringement, we recommend consulting a qualified legal professional before submitting a notice.`,
  },
  {
    title: "Contact",
    content: `All copyright-related communications, including takedown notices and counter-notices, should be directed to:\n\nSiteSynth — Copyright Agent\nEmail: copyright@scoresynth.com\nAddress: Meir 67, Oppuurs, Belgium\n\nFor general legal inquiries, contact: legal@scoresynth.com`,
  },
];

export default function CopyrightPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "96px", paddingLeft: "32px", paddingRight: "32px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "3rem", lineHeight: 1.1, marginBottom: "12px" }}>
            Copyright &amp; DMCA Policy
          </h1>
          <p style={{ fontSize: "14px", color: "#a89690", marginBottom: "56px" }}>
            Last updated: April 17, 2026
          </p>

          <p style={{ fontSize: "15px", color: "#a89690", lineHeight: 1.8, marginBottom: "48px" }}>
            This policy describes how ScoreSynth, operated by SiteSynth (Belgium), handles copyright infringement reports and counter-notices. To report infringing content, contact us at{" "}
            <a href="mailto:copyright@scoresynth.com" style={{ color: "#c8a97e", textDecoration: "none" }}>
              copyright@scoresynth.com
            </a>.
          </p>

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
