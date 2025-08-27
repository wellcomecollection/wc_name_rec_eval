import { useAuthenticator } from "@aws-amplify/ui-react";

export default function UserInfo() {
  const { signOut, user } = useAuthenticator();

  return (
    <>
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        🥳 Help us evaluate the accuracy of our Name Reconciliation Service.
        <br />
        We recommend evaluating in 15 minute sessions (about 20-30 records).
        <br />
      </div>

      <div
        style={{
          marginBottom: "10px",
          textAlign: "center",
          fontSize: "14px",
          color: "#666",
        }}
      >
        Signed in as:{" "}
        <strong>{user?.signInDetails?.loginId || "Unknown user"}</strong>
      </div>

      <button onClick={signOut}>Sign out</button>
    </>
  );
}
