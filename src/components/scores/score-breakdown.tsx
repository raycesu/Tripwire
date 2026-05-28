type ScoreBreakdownProps = {
  components: Record<string, unknown> | null
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—"
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}

const isNestedComponent = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const ScoreBreakdown = ({ components }: ScoreBreakdownProps) => {
  if (!components || Object.keys(components).length === 0) {
    return null
  }

  const entries = Object.entries(components).filter(
    ([key]) => key !== "formatted_score" && key !== "score"
  )

  if (entries.length === 0) {
    return null
  }

  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        View breakdown
      </summary>
      <dl className="mt-2 space-y-2 rounded-md bg-muted/40 p-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {key.replace(/_/g, " ")}
            </dt>
            {isNestedComponent(value) ? (
              <dd className="mt-1 space-y-1 pl-2">
                {Object.entries(value).map(([nestedKey, nestedValue]) => (
                  <div key={nestedKey} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{nestedKey.replace(/_/g, " ")}</span>
                    <span className="font-mono text-foreground">{formatValue(nestedValue)}</span>
                  </div>
                ))}
              </dd>
            ) : (
              <dd className="mt-0.5 font-mono text-foreground">{formatValue(value)}</dd>
            )}
          </div>
        ))}
      </dl>
    </details>
  )
}
