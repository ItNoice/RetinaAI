// Real per-class precision/recall/F1, derived from the confusion matrix
// already returned by the backend — no new backend call needed, and no
// numbers beyond what ml/evaluate.py actually computed.
export interface PerClassStats {
  className: string;
  support: number; // true instances of this class
  precision: number;
  recall: number;
  f1: number;
}

export function computePerClassStats(
  matrix: number[][],
  classNames: string[],
): PerClassStats[] {
  const n = classNames.length;
  return classNames.map((className, i) => {
    const tp = matrix[i][i];
    const rowSum = matrix[i].reduce((a, b) => a + b, 0);
    let colSum = 0;
    for (let r = 0; r < n; r++) colSum += matrix[r][i];

    const fn = rowSum - tp;
    const fp = colSum - tp;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return { className, support: rowSum, precision, recall, f1 };
  });
}
