export const metadata = {
  title: "Terms of Use - Name Reconciliation Service",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Terms of Use</h1>
      <p>
        <em>Last updated: September 17, 2025</em>
      </p>
      <p>
        These Terms of Use ("Terms") govern your access to and use of the Name
        Reconciliation Service evaluation interface (the "Service"). By
        accessing or using the Service you confirm that you agree to these
        Terms.
      </p>
      <h2>Purpose of the Service</h2>
      <p>
        The Service is provided for the limited purpose of evaluating and
        improving Wellcome Collection name reconciliation models. You agree not
        to use the Service for production, commercial, or unrelated research
        purposes.
      </p>
      <h2>Your Responsibilities</h2>
      <ul>
        <li>Provide good-faith and non-malicious evaluations.</li>
        <li>Do not attempt to extract, re-identify, or misuse any data.</li>
        <li>Maintain confidentiality of any non-public information.</li>
      </ul>
      <h2>Data</h2>
      <p>
        Evaluation data (including your selections and derived metrics) may be
        logged and analysed internally to improve model performance and quality
        assurance processes.
      </p>
      <h2>Account & Access</h2>
      <p>
        Access is only available when connected through the Wellcome Trust VPN
        or equivalent secure network context. Attempts to access the Service
        from outside approved network boundaries may be blocked and logged.
        Access may be revoked at any time for misuse, security concerns, or at
        the discretion of the maintainers.
      </p>
      <h2>Disclaimer</h2>
      <p>
        The Service is provided on an experimental and informational basis
        without warranties of any kind. It may be modified, suspended, or
        discontinued without notice.
      </p>
      <h2>Contact</h2>
      <p>
        For questions about these Terms, please contact the Wellcome Collection
        Digital Platform Team via your normal internal channels.
      </p>
    </main>
  );
}
