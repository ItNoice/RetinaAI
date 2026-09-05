// Single-hue intensity, normalized per row (so it reads as recall). Every cell
// keeps its number, and the diagonal gets a border — never colour alone.
const ACCENT_HUE = 221;
const ACCENT_SATURATION = 70;

function cellStyle(intensity: number): { background: string; color: string } {
  const lightness = 94 - intensity * 60; // 94% (near white) -> 34% (dark blue)
  return {
    background: `hsl(${ACCENT_HUE} ${ACCENT_SATURATION}% ${lightness}%)`,
    color: intensity > 0.55 ? "#f7f8fa" : "#0a0d12",
  };
}

export default function ConfusionMatrix({
  matrix,
  classNames,
}: {
  matrix: number[][];
  classNames: string[];
}) {
  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <caption className="sr-only">
          Confusion matrix: rows are the true class, columns are the model's
          predicted class.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-right align-bottom text-clinic-400 font-normal">
              True \ Predicted
            </th>
            {classNames.map((name) => (
              <th
                key={name}
                scope="col"
                className="p-2 text-center font-medium text-clinic-600 whitespace-nowrap"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={classNames[i]}>
              <th
                scope="row"
                className="p-2 text-right font-medium text-clinic-600 whitespace-nowrap"
              >
                {classNames[i]}
              </th>
              {row.map((count, j) => {
                const intensity = rowTotals[i] > 0 ? count / rowTotals[i] : 0;
                const style = cellStyle(intensity);
                const isDiagonal = i === j;
                return (
                  <td
                    key={j}
                    className={`p-2 text-center tabular w-14 ${
                      isDiagonal ? "ring-2 ring-inset ring-clinic-900/40" : ""
                    }`}
                    style={style}
                    title={`True: ${classNames[i]}, predicted: ${classNames[j]} — ${count} image${count === 1 ? "" : "s"}`}
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
