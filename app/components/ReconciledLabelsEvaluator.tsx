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
                        evaluation === "yes" ? "#28a745" : "#fff",
                      color: evaluation === "yes" ? "white" : "#28a745",
                      border: "1px solid #28a745",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      minWidth: "50px",
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
                      backgroundColor: evaluation === "no" ? "#ff1493" : "#fff",
                      color: evaluation === "no" ? "white" : "#ff1493",
                      border: "1px solid #ff1493",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      minWidth: "50px",
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
                      backgroundColor:
                        evaluation === "unsure" ? "#ffc107" : "#fff",
                      color: evaluation === "unsure" ? "white" : "#ffc107",
                      border: "1px solid #ffc107",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      minWidth: "60px",
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
