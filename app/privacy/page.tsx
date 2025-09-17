export const metadata = {
  title: "Privacy Policy - Name Reconciliation Service",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Privacy Policy</h1>
      <p>
        <em>Last updated: September 17, 2025</em>
      </p>
      <p>
        This Privacy Policy describes how evaluation interaction data is handled
        when you use the Name Reconciliation Service (the "Service").
      </p>
      <h2>Information We Collect</h2>
      <ul>
        <li>Account information (email / unique identifier from sign-in).</li>
        <li>Evaluation actions (label choices, timestamps, counts).</li>
        <li>Aggregated analytics to improve model quality.</li>
      </ul>
      <h2>How We Use Information</h2>
      <p>
        Collected information is used solely to improve reconciliation models,
        monitor quality, and understand evaluation coverage. It is not sold or
        shared externally except in aggregated or anonymised form.
      </p>
      <h2>Data Retention</h2>
      <p>
        Evaluation records may be retained for the lifecycle of the project to
        support reproducibility and model auditability.
      </p>
      <h2>Security</h2>
      <p>
        Access is restricted to authorised project team members and requires
        connection via the Wellcome Trust VPN or other approved secure network
        context. Network-level and application-level logging may be used to
        monitor for anomalous or unauthorised access attempts. Reasonable
        technical and organisational measures are applied to protect the
        information.
      </p>
      <h2>Your Choices</h2>
      <p>
        If you wish to stop participating, simply discontinue use of the
        Service. For queries regarding data handling, contact the Wellcome
        Collection Digital Platform Team through internal channels.
      </p>
      <h2>Changes</h2>
      <p>
        This policy may be updated. Continued use after changes indicates
        acceptance of the revised policy.
      </p>
      <h2>Contact</h2>
      <p>
        For questions about this policy, please reach out to the Wellcome
        Collection Digital Platform Team via established internal channels.
      </p>
    </main>
  );
}
