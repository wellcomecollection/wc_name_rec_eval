"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [nameReconciliations, setNameReconciliations] = useState<
    Array<Schema["NameReconciliation"]["type"]>
  >([]);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [showCandidates, setShowCandidates] = useState(false);

  function listNameReconciliations() {
    client.models.NameReconciliation.observeQuery().subscribe({
      next: (data) => setNameReconciliations([...data.items]),
    });
  }

  useEffect(() => {
    listNameReconciliations();
  }, []);

  // Initialize to the first useful record when data loads
  useEffect(() => {
    if (nameReconciliations.length > 0 && currentRecordIndex === 0) {
      // Find the first useful record
      const firstUsefulIndex = nameReconciliations.findIndex(isRecordUseful);
      if (firstUsefulIndex !== -1 && firstUsefulIndex !== currentRecordIndex) {
        setCurrentRecordIndex(firstUsefulIndex);
      }
    }
  }, [nameReconciliations, currentRecordIndex]);

  // Helper function to check if a record is useful for evaluation
  const isRecordUseful = (record: Schema["NameReconciliation"]["type"]) => {
    // Parse reconciled_labels
    const reconciledLabels =
      typeof record.reconciled_labels === "string"
        ? JSON.parse(record.reconciled_labels)
        : record.reconciled_labels || [];

    // Skip if reconciled_labels only contains the same idx as the main record
    const filteredLabels = reconciledLabels.filter(
      (reconLabel: any) => reconLabel.idx !== record.idx
    );

    return filteredLabels.length > 0;
  };

  // Find the next record without evaluation that has meaningful reconciled labels
  function findNextUnevaluatedIndex(): number {
    const isRecordUsefulForEvaluation = (
      record: Schema["NameReconciliation"]["type"]
    ) => {
      // Check if record is unevaluated
      if (
        record.evaluation_result !== null &&
        record.evaluation_result !== undefined
      ) {
        return false;
      }

      return isRecordUseful(record);
    };

    for (let i = currentRecordIndex + 1; i < nameReconciliations.length; i++) {
      if (isRecordUsefulForEvaluation(nameReconciliations[i])) {
        return i;
      }
    }
    // If no more useful unevaluated records after current, wrap to beginning
    for (let i = 0; i < currentRecordIndex; i++) {
      if (isRecordUsefulForEvaluation(nameReconciliations[i])) {
        return i;
      }
    }
    return currentRecordIndex; // Stay on current if all are evaluated or not useful
  }

  // Find the previous useful record
  function findPreviousUsefulIndex(): number {
    for (let i = currentRecordIndex - 1; i >= 0; i--) {
      if (isRecordUseful(nameReconciliations[i])) {
        return i;
      }
    }
    // If no useful records before current, wrap to end
    for (let i = nameReconciliations.length - 1; i > currentRecordIndex; i--) {
      if (isRecordUseful(nameReconciliations[i])) {
        return i;
      }
    }
    return currentRecordIndex; // Stay on current if no other useful records
  }

  // Find the next useful record
  function findNextUsefulIndex(): number {
    for (let i = currentRecordIndex + 1; i < nameReconciliations.length; i++) {
      if (isRecordUseful(nameReconciliations[i])) {
        return i;
      }
    }
    // If no useful records after current, wrap to beginning
    for (let i = 0; i < currentRecordIndex; i++) {
      if (isRecordUseful(nameReconciliations[i])) {
        return i;
      }
    }
    return currentRecordIndex; // Stay on current if no other useful records
  }

  function setEvaluationResult(id: string, result: boolean | null) {
    client.models.NameReconciliation.update({
      id: id,
      evaluation_result: result,
    });

    // Move to next unevaluated record after a short delay to allow the update to process
    if (result !== null) {
      setTimeout(() => {
        const nextIndex = findNextUnevaluatedIndex();
        setCurrentRecordIndex(nextIndex);
      }, 100);
    }
  }

  const currentRecord = nameReconciliations[currentRecordIndex];
  const usefulRecords = nameReconciliations.filter(isRecordUseful);
  const currentRecordUsefulIndex = usefulRecords.findIndex(
    (rec) => rec.id === currentRecord?.id
  );

  const unevaluatedCount = usefulRecords.filter((rec) => {
    return (
      rec.evaluation_result === null || rec.evaluation_result === undefined
    );
  }).length;

  return (
    <main>
      <h1>Name Reconciliation Service Evaluation</h1>

      <div style={{ marginTop: "20px" }}>
        {nameReconciliations.length === 0 ? (
          <p>No name reconciliation records found.</p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                padding: "10px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Record {currentRecordUsefulIndex + 1} of{" "}
                  {usefulRecords.length}
                </h3>
                <p style={{ margin: "5px 0 0 0", color: "#000000ff" }}>
                  {unevaluatedCount} records remaining to evaluate
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() =>
                    setCurrentRecordIndex(findPreviousUsefulIndex())
                  }
                  disabled={
                    nameReconciliations.filter(isRecordUseful).length <= 1
                  }
                  style={{
                    padding: "8px 12px",
                    backgroundColor:
                      nameReconciliations.filter(isRecordUseful).length <= 1
                        ? "#f8f9fa"
                        : "#007bff",
                    color:
                      nameReconciliations.filter(isRecordUseful).length <= 1
                        ? "#6c757d"
                        : "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      nameReconciliations.filter(isRecordUseful).length <= 1
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentRecordIndex(findNextUsefulIndex())}
                  disabled={
                    nameReconciliations.filter(isRecordUseful).length <= 1
                  }
                  style={{
                    padding: "8px 12px",
                    backgroundColor:
                      nameReconciliations.filter(isRecordUseful).length <= 1
                        ? "#f8f9fa"
                        : "#007bff",
                    color:
                      nameReconciliations.filter(isRecordUseful).length <= 1
                        ? "#6c757d"
                        : "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      nameReconciliations.filter(isRecordUseful).length <= 1
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>

            {currentRecord && (
              <div
                style={{
                  border: "2px solid #ccc",
                  padding: "25px",
                  borderRadius: "8px",
                  backgroundColor:
                    currentRecord.evaluation_result === true
                      ? "#f0f8f0"
                      : currentRecord.evaluation_result === false
                      ? "#fff5f5"
                      : "#fafafa",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                    Current Record:
                  </h4>
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
                      <strong style={{ color: "#2c5282" }}>
                        {currentRecord.label}
                      </strong>
                      <span style={{ color: "#666", fontSize: "12px" }}>
                        {" "}
                        (idx: {currentRecord.idx})
                      </span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const reconciledLabels =
                    typeof currentRecord.reconciled_labels === "string"
                      ? JSON.parse(currentRecord.reconciled_labels)
                      : currentRecord.reconciled_labels || [];

                  // Filter out reconciled labels with the same idx as the current record
                  const filteredLabels = reconciledLabels.filter(
                    (reconLabel: any) => reconLabel.idx !== currentRecord.idx
                  );

                  return (
                    filteredLabels.length > 0 && (
                      <div style={{ marginBottom: "25px" }}>
                        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                          Reconciled Labels ({filteredLabels.length}):
                        </h4>
                        <div
                          style={{
                            maxHeight: "300px",
                            overflowY: "auto",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            backgroundColor: "#fff",
                            padding: "10px",
                            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          <ul style={{ margin: "0", paddingLeft: "20px" }}>
                            {filteredLabels.map(
                              (reconLabel: any, index: number) => (
                                <li
                                  key={index}
                                  style={{
                                    marginBottom: "8px",
                                    fontSize: "14px",
                                  }}
                                >
                                  <strong style={{ color: "#2c5282" }}>
                                    {reconLabel.label}
                                  </strong>
                                  <span
                                    style={{ color: "#666", fontSize: "12px" }}
                                  >
                                    {" "}
                                    (idx: {reconLabel.idx})
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                        {filteredLabels.length > 10 && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              fontStyle: "italic",
                              margin: "8px 0 0 0",
                              textAlign: "center",
                            }}
                          >
                            Scroll to see all {filteredLabels.length} reconciled
                            labels
                          </p>
                        )}
                      </div>
                    )
                  );
                })()}

                {(() => {
                  const candidates =
                    typeof currentRecord.candidates === "string"
                      ? JSON.parse(currentRecord.candidates)
                      : currentRecord.candidates || [];

                  return (
                    candidates.length > 0 && (
                      <div style={{ marginBottom: "25px" }}>
                        <button
                          onClick={() => setShowCandidates(!showCandidates)}
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
                          <span>
                            📋 View All Candidates ({candidates.length})
                          </span>
                          <span
                            style={{
                              transform: showCandidates
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.2s",
                              fontSize: "12px",
                            }}
                          >
                            ▼
                          </span>
                        </button>

                        {showCandidates && (
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
                              {candidates.map(
                                (candidate: any, index: number) => (
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
                                        {(candidate.similarity * 100).toFixed(
                                          1
                                        )}
                                        % match
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
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
                                Showing all {candidates.length} candidate
                                matches
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  );
                })()}

                <div
                  style={{
                    borderTop: "2px solid #eee",
                    paddingTop: "20px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 20px 0",
                      fontWeight: "bold",
                      fontSize: "20px",
                      color: "#333",
                    }}
                  >
                    Is the name reconciliation correct?
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={() =>
                        setEvaluationResult(currentRecord.id, true)
                      }
                      style={{
                        padding: "12px 24px",
                        backgroundColor:
                          currentRecord.evaluation_result === true
                            ? "#28a745"
                            : "#fff",
                        color:
                          currentRecord.evaluation_result === true
                            ? "white"
                            : "#28a745",
                        border: "2px solid #28a745",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      ✓ Yes
                    </button>

                    <button
                      onClick={() =>
                        setEvaluationResult(currentRecord.id, false)
                      }
                      style={{
                        padding: "12px 24px",
                        backgroundColor:
                          currentRecord.evaluation_result === false
                            ? "#dc3545"
                            : "#fff",
                        color:
                          currentRecord.evaluation_result === false
                            ? "white"
                            : "#dc3545",
                        border: "2px solid #dc3545",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      ✗ No
                    </button>
                  </div>

                  {currentRecord.evaluation_result !== null && (
                    <div style={{ marginTop: "15px" }}>
                      <button
                        onClick={() =>
                          setEvaluationResult(currentRecord.id, null)
                        }
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Clear Evaluation
                      </button>
                    </div>
                  )}

                  <p
                    style={{
                      margin: "15px 0 0 0",
                      fontSize: "14px",
                      color: "#666",
                      fontStyle: "italic",
                    }}
                  >
                    {currentRecord.evaluation_result === true &&
                      "✓ Marked as correct"}
                    {currentRecord.evaluation_result === false &&
                      "✗ Marked as incorrect"}
                    {currentRecord.evaluation_result === null &&
                      "Not evaluated yet"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        🥳 Help us evaluate the accuracy of our Name Reconciliation Service
        (Wellcome Collection).
      </div>
    </main>
  );
}
