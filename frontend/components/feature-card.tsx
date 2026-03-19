import type React from "react"
import { Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
  className?: string
}

export function FeatureCard({ icon, title, description, features, className }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "border-none shadow-lg card-hover transition-all duration-300 h-full entrance-fade-scale",
        className,
      )}
    >
      <CardContent className="p-4 sm:p-6 md:p-5 lg:p-6 h-full flex flex-col">
        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 sm:mb-6 md:mb-4 lg:mb-5 icon-hover mx-auto md:mx-0">
          {icon}
        </div>
        <h3 className="text-lg sm:text-xl md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-2 lg:mb-3 text-center md:text-left leading-tight">
          {title}
        </h3>
        <p className="text-sm sm:text-base md:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6 md:mb-4 lg:mb-5 text-center md:text-left leading-relaxed flex-grow">
          {description}
        </p>

        <ul className="space-y-2 sm:space-y-3 md:space-y-2 lg:space-y-3 mb-4 sm:mb-6 md:mb-4 lg:mb-5 stagger-fade-in">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#0A64BC] mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm md:text-xs lg:text-sm text-gray-700 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/ai-voice-agents"
          className="flex items-center text-[#0A64BC] hover:text-[#0954A0] transition-all duration-300 hover-slide-right click-shrink justify-center md:justify-start mt-auto link-hover min-h-[44px] py-2"
          scroll={true}
        >
          <span className="text-sm sm:text-base font-medium">Learn more</span>
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </CardContent>
    </Card>
  )
}
