interface StatItemProps {
  value: string
  label: string
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold">{value}</span>
      <span className="text-sm sm:text-base md:text-lg lg:text-xl mt-2">{label}</span>
    </div>
  )
}

export function StatsBanner() {
  return (
    <section className="w-full bg-[#0A64BC] text-white py-8 sm:py-10 md:py-16">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4 md:gap-8 lg:gap-12">
          <StatItem value="98%" label="Accuracy Rate" />
          <StatItem value="42%" label="Increased Conversions" />
          <StatItem value="85%" label="Cost Reduction" />
          <StatItem value="24/7" label="Availability" />
        </div>
      </div>
    </section>
  )
}
