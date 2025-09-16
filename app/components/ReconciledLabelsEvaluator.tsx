import type { Schema } from "@/amplify/data/resource";

interface ReconciledLabelsEvaluatorProps {
  record: Schema["NameReconciliation"]["type"];
  onEvaluate: (
    recordId: string,
    labelIdx: number,
    result: "yes" | "no" | "unsure" | null
  ) => void;
  isExpertMode?: boolean;
}

export default function ReconciledLabelsEvaluator({
  record,
  onEvaluate,
  isExpertMode = false,
}: ReconciledLabelsEvaluatorProps) {
  const reconciledLabels =
    typeof record.reconciled_labels === "string"
      ? JSON.parse(record.reconciled_labels)
      : record.reconciled_labels || [];

  // Filter out reconciled labels with the same idx as the current record
  const filteredLabels = reconciledLabels.filter(
    (reconLabel: any) => reconLabel.idx !== record.idx
  );

  // Parse existing individual evaluations
  const labelEvaluations =
    typeof record.reconciled_labels_evaluations === "string"
      ? JSON.parse(record.reconciled_labels_evaluations || "{}")
      : record.reconciled_labels_evaluations || {};

  // Derive unique Wellcome concept IDs (portion before first underscore in idx)
  const currentConceptId = (() => {
    const raw = String(record.idx || "");
    if (!raw) return null;
    return raw.split("_")[0];
  })();

  const uniqueConceptIds = Array.from(
    new Set(
      [
        currentConceptId,
        ...filteredLabels.map((reconLabel: any) => {
          const raw = String(reconLabel.idx || "");
          const conceptId = raw.split("_")[0];
          return conceptId ? conceptId : null;
        }),
      ].filter((v: string | null): v is string => Boolean(v))
    )
  );

  if (filteredLabels.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "25px" }}>
      <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>
        Reconciled Labels ({filteredLabels.length}):
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "#666",
          margin: "0 0 15px 0",
          fontStyle: "italic",
        }}
      >
        Please evaluate each reconciled label individually:
      </p>
      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#fff",
          padding: "15px",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "grid", gap: "15px" }}>
          {filteredLabels.map((reconLabel: any, index: number) => {
            const evaluation = labelEvaluations[reconLabel.idx];
            const conceptId = String(reconLabel.idx || "").split("_")[0];
            const wellcomeUrl = conceptId
              ? `https://wellcomecollection.org/concepts/${conceptId}`
              : undefined;
            return (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  backgroundColor:
                    evaluation === "yes"
                      ? "#f0f8f0"
                      : evaluation === "no"
                      ? "#fff5f5"
                      : evaluation === "unsure"
                      ? "#fff8e1"
                      : "#fafafa",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <strong
                    style={{
                      color: "#2c5282",
                      fontSize: "15px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {reconLabel.label}
                  </strong>
                  <span
                    style={{
                      color: "#666",
                      fontSize: "12px",
                    }}
                  >
                    idx:{" "}
                    {wellcomeUrl ? (
                      <a
                        href={wellcomeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {reconLabel.idx}
                      </a>
                    ) : (
                      reconLabel.idx
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#333",
                      marginRight: "10px",
                    }}
                  >
                    Evaluation:
                  </span>

                  <button
                    onClick={() =>
                      onEvaluate(
                        record.id,
                        reconLabel.idx,
                        evaluation === "yes" ? null : "yes"
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      backgroundColor:
                        evaluation === "yes" ? "#1f7a34" : "#e6f5ea",
                      color: evaluation === "yes" ? "#ffffff" : "#124a1f",
                      border: "1px solid #1f7a34",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      minWidth: "50px",
                      boxShadow:
                        evaluation === "yes"
                          ? "0 0 0 2px rgba(31,122,52,0.25)"
                          : "none",
                      transition:
                        "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        evaluation === "yes" ? "#17602a" : "#d1eedc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        evaluation === "yes" ? "#1f7a34" : "#e6f5ea";
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = "2px solid #124a1f";
                      e.currentTarget.style.outlineOffset = "2px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                  >
                    {evaluation === "yes" ? "✓" : ""} Yes
                  </button>

                  <button
                    onClick={() =>
                      onEvaluate(
                        record.id,
                        reconLabel.idx,
                        evaluation === "no" ? null : "no"
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      backgroundColor:
                        evaluation === "no" ? "#b0005f" : "#ffe6f3",
                      color: evaluation === "no" ? "#ffffff" : "#750042",
                      border: "1px solid #b0005f",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      minWidth: "50px",
                      boxShadow:
                        evaluation === "no"
                          ? "0 0 0 2px rgba(176,0,95,0.25)"
                          : "none",
                      transition:
                        "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        evaluation === "no" ? "#8c004d" : "#ffd1ea";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        evaluation === "no" ? "#b0005f" : "#ffe6f3";
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = "2px solid #750042";
                      e.currentTarget.style.outlineOffset = "2px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                  >
                    {evaluation === "no" ? "✗" : ""} No
                  </button>

                  <button
                    onClick={() =>
                      onEvaluate(
                        record.id,
                        reconLabel.idx,
                        evaluation === "unsure" ? null : "unsure"
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      // Updated for better accessibility (higher contrast than #ffc107 on white)
                      backgroundColor:
                        evaluation === "unsure" ? "#b67600" : "#fff8e6",
                      color: evaluation === "unsure" ? "#ffffff" : "#5a3d00",
                      border: "1px solid #b67600",
                      boxShadow:
                        evaluation === "unsure"
                          ? "0 0 0 2px rgba(182,118,0,0.25)"
                          : "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      minWidth: "60px",
                      transition:
                        "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        evaluation === "unsure" ? "#9c6200" : "#ffe3b3";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        evaluation === "unsure" ? "#b67600" : "#fff8e6";
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = "2px solid #7a4800";
                      e.currentTarget.style.outlineOffset = "2px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                  >
                    {evaluation === "unsure" ? "?" : ""} Unsure
                  </button>

                  {evaluation !== null &&
                    evaluation !== undefined &&
                    isExpertMode && (
                      <button
                        onClick={() =>
                          onEvaluate(record.id, reconLabel.idx, null)
                        }
                        style={{
                          padding: "6px 8px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                        }}
                      >
                        Clear
                      </button>
                    )}
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#666",
                    fontStyle: "italic",
                  }}
                >
                  {evaluation === "yes" && "✓ Marked as correct match"}
                  {evaluation === "no" && "✗ Marked as incorrect match"}
                  {evaluation === "unsure" && "? Marked as unsure"}
                  {(evaluation === null || evaluation === undefined) &&
                    "Not evaluated yet"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {filteredLabels.length > 3 && (
        <p
          style={{
            fontSize: "12px",
            color: "#666",
            fontStyle: "italic",
            margin: "12px 0 0 0",
            textAlign: "center",
          }}
        >
          Scroll to see all {filteredLabels.length} reconciled labels for
          evaluation
        </p>
      )}

      {isExpertMode && uniqueConceptIds.length > 0 && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "#333",
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Unique concept links: {uniqueConceptIds.length}
        </div>
      )}
    </div>
  );
}
