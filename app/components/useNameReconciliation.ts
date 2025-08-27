import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

export function useNameReconciliation() {
  const { user } = useAuthenticator();
  const [nameReconciliations, setNameReconciliations] = useState<
    Array<Schema["NameReconciliation"]["type"]>
  >([]);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);

  function listNameReconciliations() {
    client.models.NameReconciliation.observeQuery().subscribe({
      next: (data) => setNameReconciliations([...data.items]),
    });
  }

  useEffect(() => {
    listNameReconciliations();
  }, []);

  // Initialize to a random unevaluated useful record when data loads
  useEffect(() => {
    if (nameReconciliations.length > 0 && currentRecordIndex === 0) {
      const randomIndex = findRandomUnevaluatedRecord();
      if (randomIndex !== currentRecordIndex) {
        setCurrentRecordIndex(randomIndex);
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

  // New function to handle individual reconciled label evaluation
  function setReconciledLabelEvaluation(
    recordId: string,
    labelIdx: number,
    result: "yes" | "no" | "unsure" | null
  ) {
    const record = nameReconciliations.find((r) => r.id === recordId);
    if (!record) return;

    // Parse existing evaluations
    const existingEvaluations =
      typeof record.reconciled_labels_evaluations === "string"
        ? JSON.parse(record.reconciled_labels_evaluations || "{}")
        : record.reconciled_labels_evaluations || {};

    // Update the specific label evaluation
    const updatedEvaluations = {
      ...existingEvaluations,
      [labelIdx]: result,
    };

    // Remove the evaluation if it's null (cleared)
    if (result === null) {
      delete updatedEvaluations[labelIdx];
    }

    client.models.NameReconciliation.update({
      id: recordId,
      reconciled_labels_evaluations: JSON.stringify(updatedEvaluations),
    });

    // Update local state immediately for better UX
    setNameReconciliations((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              reconciled_labels_evaluations: JSON.stringify(updatedEvaluations),
            }
          : r
      )
    );
  }

  // Helper function to check if all reconciled labels in a record have been evaluated
  function areAllLabelsEvaluated(
    record: Schema["NameReconciliation"]["type"]
  ): boolean {
    const reconciledLabels =
      typeof record.reconciled_labels === "string"
        ? JSON.parse(record.reconciled_labels)
        : record.reconciled_labels || [];

    // Filter out labels with the same idx as the main record
    const filteredLabels = reconciledLabels.filter(
      (reconLabel: any) => reconLabel.idx !== record.idx
    );

    if (filteredLabels.length === 0) return true; // No labels to evaluate

    const labelEvaluations =
      typeof record.reconciled_labels_evaluations === "string"
        ? JSON.parse(record.reconciled_labels_evaluations || "{}")
        : record.reconciled_labels_evaluations || {};

    // Check if every filtered label has an evaluation
    return filteredLabels.every((reconLabel: any) => {
      const evaluation = labelEvaluations[reconLabel.idx];
      return (
        evaluation === "yes" || evaluation === "no" || evaluation === "unsure"
      );
    });
  }

  // Function to find a random useful record that hasn't been evaluated yet
  function findRandomUnevaluatedRecord(): number {
    // Filter for useful records that don't have an evaluator_id
    const unevaluatedRecords = nameReconciliations
      .map((record, index) => ({ record, index }))
      .filter(
        ({ record }) =>
          isRecordUseful(record) &&
          (!record.evaluator_id || record.evaluator_id.trim() === "")
      );

    if (unevaluatedRecords.length === 0) {
      // If no unevaluated records, fall back to any useful record
      const usefulRecords = nameReconciliations
        .map((record, index) => ({ record, index }))
        .filter(({ record }) => isRecordUseful(record));

      if (usefulRecords.length === 0) return currentRecordIndex;

      const randomIndex = Math.floor(Math.random() * usefulRecords.length);
      return usefulRecords[randomIndex].index;
    }

    // Randomly select from unevaluated records
    const randomIndex = Math.floor(Math.random() * unevaluatedRecords.length);
    return unevaluatedRecords[randomIndex].index;
  }

  // Function to handle Next Record button press with evaluator ID recording
  async function handleNextRecord() {
    if (!currentRecord || !user?.signInDetails?.loginId) return;

    try {
      // Update the record with evaluator ID
      await client.models.NameReconciliation.update({
        id: currentRecord.id,
        evaluator_id: user.signInDetails.loginId,
      });

      // Update local state
      setNameReconciliations((prev) =>
        prev.map((r) =>
          r.id === currentRecord.id
            ? { ...r, evaluator_id: user.signInDetails?.loginId || "" }
            : r
        )
      );

      // Move to a random unevaluated record
      setCurrentRecordIndex(findRandomUnevaluatedRecord());
    } catch (error) {
      console.error("Error updating evaluator ID:", error);
      // Still move to next record even if update fails
      setCurrentRecordIndex(findRandomUnevaluatedRecord());
    }
  }

  const currentRecord = nameReconciliations[currentRecordIndex];
  const usefulRecords = nameReconciliations.filter(isRecordUseful);
  const currentRecordUsefulIndex = usefulRecords.findIndex(
    (rec) => rec.id === currentRecord?.id
  );

  const unevaluatedCount = nameReconciliations.filter(
    (record) =>
      isRecordUseful(record) &&
      (!record.evaluator_id || record.evaluator_id.trim() === "")
  ).length;

  return {
    nameReconciliations,
    currentRecord,
    currentRecordIndex,
    usefulRecords,
    currentRecordUsefulIndex,
    unevaluatedCount,
    setCurrentRecordIndex,
    findPreviousUsefulIndex,
    findNextUsefulIndex,
    setReconciledLabelEvaluation,
    areAllLabelsEvaluated,
    handleNextRecord,
    isRecordUseful,
  };
}
