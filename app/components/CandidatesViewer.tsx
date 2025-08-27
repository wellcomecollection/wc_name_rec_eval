import { useState } from "react";
import type { Schema } from "@/amplify/data/resource";

interface CandidatesViewerProps {
  record: Schema["NameReconciliation"]["type"];
}

export default function CandidatesViewer({ record }: CandidatesViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const candidates =
    typeof record.candidates === "string"
      ? JSON.parse(record.candidates)
      : record.candidates || [];

  if (candidates.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "25px" }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          padding: "12px 16px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "6px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "16px",
          fontWeight: "500",
          color: "#495057",
          transition: "background-color 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#e9ecef";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
        }}
      >
        <span>📋 View All Candidates ({candidates.length})</span>
        <span
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            fontSize: "12px",
          }}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: "10px",
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: "6px",
            backgroundColor: "#fff",
            padding: "15px",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "grid", gap: "12px" }}>
            {candidates.map((candidate: any, index: number) => (
              <div
                key={index}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <strong
                    style={{
                      color: "#2c5282",
                      fontSize: "14px",
                    }}
                  >
                    {candidate.label}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <span>idx: {candidate.idx}</span>
                  <span
                    style={{
                      fontWeight: "600",
                      color:
                        candidate.similarity > 0.7
                          ? "#28a745"
                          : candidate.similarity > 0.5
                          ? "#ffc107"
                          : "#dc3545",
                    }}
                  >
                    {(candidate.similarity * 100).toFixed(1)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
          {candidates.length > 10 && (
            <p
              style={{
                fontSize: "12px",
                color: "#666",
                fontStyle: "italic",
                margin: "12px 0 0 0",
                textAlign: "center",
              }}
            >
              Showing all {candidates.length} candidate matches
            </p>
          )}
        </div>
      )}
    </div>
  );
}
