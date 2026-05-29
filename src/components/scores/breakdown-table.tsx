type BreakdownRow = {
  label: string
  value: string
  score?: string
  weight?: string
  detail?: string
}

type BreakdownTableProps = {
  rows: BreakdownRow[]
  footnote?: string
}

export const BreakdownTable = ({ rows, footnote }: BreakdownTableProps) => {
  if (rows.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 font-medium">Component</th>
            <th className="pb-2 font-medium">Value</th>
            <th className="pb-2 font-medium text-right">Sub-score</th>
            <th className="pb-2 font-medium text-right">Weight</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="py-2 pr-2">
                <span className="text-foreground">{row.label}</span>
                {row.detail ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
                ) : null}
              </td>
              <td className="py-2 font-mono text-muted-foreground">{row.value}</td>
              <td className="py-2 text-right font-mono">{row.score ?? "—"}</td>
              <td className="py-2 text-right font-mono text-muted-foreground">
                {row.weight ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? <p className="text-xs text-muted-foreground">{footnote}</p> : null}
    </div>
  )
}
