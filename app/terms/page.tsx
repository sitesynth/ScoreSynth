import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "Parties and Legal Entity",
    content: `These Terms of Service ("Terms") constitute a legally binding agreement between you ("User") and SiteSynth, a company incorporated under Belgian law ("SiteSynth", "we", "us", or "our"), operating the ScoreSynth platform available at scoresynth.com ("the Platform"). By accessing or using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must immediately stop using the Platform.`,
  },
  {
    title: "Description of the Platform",
    content: `ScoreSynth is a technical platform that provides tools for uploading, sharing, and accessing sheet music and related music files. SiteSynth acts solely as a technical intermediary that hosts content uploaded by users. SiteSynth does not create, curate, review, or endorse any user-uploaded content, and does not claim ownership of any such content.`,
  },
  {
    title: "User Accounts",
    content: `To upload content or access certain features, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must provide accurate and complete registration information. You may not share your account or create accounts for any unlawful purpose. Notify us immediately at support@scoresynth.com if you suspect unauthorized use of your account.`,
  },
  {
    title: "User Responsibility for Uploaded Content",
    content: `You are solely and exclusively responsible for all content you upload, publish, or otherwise make available through the Platform ("User Content"). You represent and warrant that: (a) you are the original author or rights holder of the User Content, or you hold a valid license or authorization from the copyright owner that permits you to upload and distribute such content through the Platform; (b) your User Content does not infringe any copyright, trademark, trade secret, moral right, or other intellectual property or proprietary right of any third party; (c) your User Content does not violate any applicable law or regulation; and (d) you have obtained all necessary consents, permissions, and licenses required to upload and share the content. SiteSynth does not verify, and bears no responsibility for, the accuracy of these representations.`,
  },
  {
    title: "Grant of License",
    content: `By uploading User Content to the Platform, you grant SiteSynth a non-exclusive, worldwide, royalty-free, sublicensable license to host, store, display, reproduce, and distribute your User Content solely for the purpose of operating and providing the Platform and its features. This license does not transfer ownership of your User Content to SiteSynth. You retain all ownership rights in your User Content.`,
  },
  {
    title: "Indemnification",
    content: `You agree to fully indemnify, defend, and hold harmless SiteSynth and its officers, directors, employees, agents, contractors, licensors, and successors from and against any and all claims, damages, liabilities, losses, costs, and expenses (including reasonable legal fees and court costs) arising out of or relating to: (a) your User Content, including any claim that your User Content infringes the intellectual property rights or other rights of any third party; (b) your use of the Platform; (c) your breach of these Terms or the representations and warranties contained herein; or (d) your violation of any applicable law or regulation. SiteSynth reserves the right to assume the exclusive defense and control of any matter subject to indemnification by you, and you agree to cooperate fully with SiteSynth's defense of such claims.`,
  },
  {
    title: "Platform as Technical Intermediary — No Liability for User Content",
    content: `SiteSynth operates solely as a passive technical intermediary and hosting provider. SiteSynth does not monitor, pre-screen, or editorially control User Content uploaded to the Platform. SiteSynth is not the author, publisher, or distributor of User Content and shall not be held liable for any User Content posted by users. In accordance with applicable Belgian law and EU regulations, including the EU Digital Services Act (DSA), SiteSynth's liability for user-generated content is limited to the extent permitted by applicable law for hosting service providers acting in good faith.`,
  },
  {
    title: "Right to Remove Content",
    content: `SiteSynth reserves the right, at its sole discretion and without prior notice, to remove, disable access to, or otherwise take down any User Content that: (a) is the subject of a valid copyright takedown notice; (b) violates these Terms or applicable law; (c) is reported as infringing or unlawful; or (d) SiteSynth determines, in its sole judgment, poses a legal or reputational risk to the Platform. SiteSynth may also suspend or terminate the account of any user who repeatedly infringes third-party rights. SiteSynth shall not be liable to any user for any removal of content carried out under this provision.`,
  },
  {
    title: "Copyright and Intellectual Property",
    content: `The Platform's software, design, trademarks, and proprietary content are owned by SiteSynth and protected by intellectual property law. You may not copy, reproduce, or create derivative works of Platform components without express written permission. For copyright takedown requests regarding User Content, please refer to our Copyright & DMCA Policy at scoresynth.com/copyright.`,
  },
  {
    title: "Prohibited Uses",
    content: `You agree not to use the Platform to: (a) upload content you do not have the right to distribute; (b) infringe any third-party intellectual property rights; (c) engage in unauthorized scraping, reverse engineering, or data mining; (d) circumvent access controls or security measures; (e) distribute malicious code or interfere with Platform infrastructure; or (f) use the Platform for any unlawful purpose or in a manner that violates these Terms.`,
  },
  {
    title: "Disclaimer of Warranties",
    content: `THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY BELGIAN AND EU LAW, SITESYNTH DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. SITESYNTH DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE FROM SECURITY VULNERABILITIES.`,
  },
  {
    title: "Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SITESYNTH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM OR ANY USER CONTENT. IN NO EVENT SHALL SITESYNTH'S TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) €100 OR (B) THE TOTAL FEES PAID BY YOU TO SITESYNTH IN THE THREE (3) MONTHS PRECEDING THE CLAIM. NOTHING IN THESE TERMS LIMITS SITESYNTH'S LIABILITY FOR DEATH OR PERSONAL INJURY CAUSED BY ITS NEGLIGENCE, FRAUD, OR ANY OTHER LIABILITY THAT CANNOT BE EXCLUDED UNDER APPLICABLE BELGIAN LAW.`,
  },
  {
    title: "Governing Law and Jurisdiction",
    content: `These Terms and any dispute arising out of or in connection with them shall be governed by and construed exclusively in accordance with the laws of Belgium, without regard to its conflict of law provisions. The parties irrevocably submit to the exclusive jurisdiction of the competent courts of Belgium to settle any dispute or claim arising out of or in connection with these Terms or their subject matter. If you are a consumer within the European Union, you may also have the right to bring proceedings in the courts of your country of residence and to benefit from mandatory consumer protection provisions of your country's law.`,
  },
  {
    title: "Changes to Terms",
    content: `SiteSynth reserves the right to modify these Terms at any time. We will provide at least 14 days' notice of material changes via email or a prominent notice on the Platform. Your continued use of the Platform after the effective date of changes constitutes your acceptance of the revised Terms. If you do not agree to the updated Terms, you must stop using the Platform before the changes take effect.`,
  },
  {
    title: "Contact",
    content: `If you have questions about these Terms of Service, please contact us at:\n\nSiteSynth\nEmail: legal@scoresynth.com\nAddress: Meir 67, Oppuurs, Belgium`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "96px", paddingLeft: "32px", paddingRight: "32px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "3rem", lineHeight: 1.1, marginBottom: "12px" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: "14px", color: "#a89690", marginBottom: "56px" }}>
            Last updated: April 17, 2026
          </p>

          <p style={{ fontSize: "15px", color: "#a89690", lineHeight: 1.8, marginBottom: "48px" }}>
            Please read these Terms of Service carefully before using ScoreSynth. These Terms govern your access to and use of the ScoreSynth platform operated by SiteSynth, a Belgian company, including all content, features, and services offered through scoresynth.com.
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
