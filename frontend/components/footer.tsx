"use client"

import { Mic } from "lucide-react"
import { useState } from "react"

export function Footer() {
  const [waveIcon, setWaveIcon] = useState(false)

  const handleIconHover = () => {
    setWaveIcon(true)
    setTimeout(() => setWaveIcon(false), 1500)
  }

  return (
    <footer className="w-full py-12 sm:py-16 md:py-12 lg:py-14 bg-white">
      <div className="container px-6 sm:px-8 md:px-10 lg:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center">
          {/* Animated logo */}
          <div
            className="flex items-center mb-8 sm:mb-10 md:mb-8 lg:mb-10 cursor-pointer hover-scale-sm"
            onMouseEnter={handleIconHover}
          >
            <div
              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#0A64BC] flex items-center justify-center mr-3 sm:mr-4 transition-all duration-300 hover-scale ${waveIcon ? "animate-wave" : ""}`}
            >
              <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 transition-all duration-300 hover-lift">
              SONIC AI
            </span>
          </div>

          {/* Animated divider */}
          <div className="w-16 sm:w-20 h-px bg-gray-200 mb-8 sm:mb-10 md:mb-8 lg:mb-10 animate-fade-in"></div>

          {/* Animated links */}
          <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-8 md:gap-x-10 gap-y-3 sm:gap-y-4 mb-8 sm:mb-10 md:mb-8 lg:mb-10 stagger-fade-in">
            <a
              href="#"
              className="text-base sm:text-lg text-gray-500 hover:text-[#0A64BC] transition-all duration-300 link-hover click-shrink"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-base sm:text-lg text-gray-500 hover:text-[#0A64BC] transition-all duration-300 link-hover click-shrink"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-base sm:text-lg text-gray-500 hover:text-[#0A64BC] transition-all duration-300 link-hover click-shrink"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-base sm:text-lg text-gray-500 hover:text-[#0A64BC] transition-all duration-300 link-hover click-shrink"
            >
              Support
            </a>
          </div>

          {/* Animated copyright */}
          <div
            className="text-sm sm:text-base text-gray-400 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            © {new Date().getFullYear()} SONIC AI
          </div>
        </div>
      </div>
    </footer>
  )
}
