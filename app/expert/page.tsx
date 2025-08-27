"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { useNameReconciliation } from "../components/useNameReconciliation";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import RecordDisplay from "../components/RecordDisplay";
import ReconciledLabelsEvaluator from "../components/ReconciledLabelsEvaluator";
import CandidatesViewer from "../components/CandidatesViewer";
import EvaluationStatus from "../components/EvaluationStatus";
import UserInfo from "../components/UserInfo";
import "../app.css";

Amplify.configure(outputs);

export default function ExpertApp() {
  const {
    nameReconciliations,
    currentRecord,
    currentRecordUsefulIndex,
    usefulRecords,
    unevaluatedCount,
    setCurrentRecordIndex,
    findPreviousUsefulIndex,
    findNextUsefulIndex,
    setReconciledLabelEvaluation,
    areAllLabelsEvaluated,
    handleNextRecord,
  } = useNameReconciliation();

  return (
    <main>
      <Header isExpertMode={true} />

      <div style={{ marginTop: "20px" }}>
        {nameReconciliations.length === 0 ? (
          <p>No name reconciliation records found.</p>
        ) : (
          <>
            <Navigation
              currentRecordUsefulIndex={currentRecordUsefulIndex}
              totalUsefulRecords={usefulRecords.length}
              onPrevious={() =>
                setCurrentRecordIndex(findPreviousUsefulIndex())
              }
              onNext={() => setCurrentRecordIndex(findNextUsefulIndex())}
              areAllLabelsEvaluated={
                currentRecord ? areAllLabelsEvaluated(currentRecord) : false
              }
            />

            {currentRecord && (
              <div
                style={{
                  border: "2px solid #ccc",
                  padding: "25px",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                <RecordDisplay record={currentRecord} />

                <ReconciledLabelsEvaluator
                  record={currentRecord}
                  onEvaluate={setReconciledLabelEvaluation}
                  isExpertMode={true}
                />

                <CandidatesViewer record={currentRecord} />
              </div>
            )}
          </>
        )}
      </div>

      <UserInfo />
    </main>
  );
}
