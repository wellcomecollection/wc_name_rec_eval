import type { Schema } from "@/amplify/data/resource";

interface RecordDisplayProps {
  record: Schema["NameReconciliation"]["type"];
}

export default function RecordDisplay({ record }: RecordDisplayProps) {
  const conceptId = String(record.idx || "").split("_")[0];
  const wellcomeUrl = conceptId
    ? `https://wellcomecollection.org/concepts/${conceptId}`
    : undefined;
  return (
    <div style={{ marginBottom: "20px" }}>
      <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Current Record:</h4>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#fff",
          padding: "10px",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontSize: "14px" }}>
          <strong style={{ color: "#2c5282" }}>{record.label}</strong>
          <span style={{ color: "#666", fontSize: "12px" }}>
            {" "}
            (idx: {wellcomeUrl ? (
              <a href={wellcomeUrl} target="_blank" rel="noopener noreferrer">
                {record.idx}
              </a>
            ) : (
              record.idx
            )})
          </span>
        </div>
      </div>
    </div>
  );
}
