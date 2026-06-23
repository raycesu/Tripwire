const stats = [
  { value: "3", label: "Backtested sectors" },
  { value: "6k+", label: "Tracked symbols" },
  { value: "24/7", label: "Alert monitoring" },
] as const

export const LandingStats = () => {
  return (
    <section
      className="grid max-w-md shrink-0 grid-cols-3 gap-4 pt-2 sm:gap-6 sm:pt-4"
      aria-label="Tripwire highlights"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1">
          <span className="text-3xl font-bold text-metallic sm:text-4xl">
            {stat.value}
          </span>
          <span className="text-sm text-muted-foreground">{stat.label}</span>
        </div>
      ))}
    </section>
  )
}
