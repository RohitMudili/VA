"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import { MobileMenu } from "@/components/mobile-menu"
import Link from "next/link"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id)
    const navbar = document.querySelector("header")
    if (element && navbar) {
      const navbarRect = navbar.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const offset = -90
      const scrollPosition = elementRect.top + window.scrollY - navbarRect.height - offset

      window.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      })
    }
  }, [])

  useEffect(() => {
    let ticking = false
    let lastScrollY = 0

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (!ticking) {
        requestAnimationFrame(() => {
          // Only update if scroll position changed significantly
          if (Math.abs(currentScrollY - lastScrollY) > 5) {
            setIsScrolled(currentScrollY > 10)

            // Determine active section
            const sections = ["home", "benefits", "how-it-works", "contact"]
            const scrollPosition = currentScrollY + 100

            for (let i = sections.length - 1; i >= 0; i--) {
              const section = document.getElementById(sections[i])
              if (section && section.offsetTop <= scrollPosition) {
                setActiveSection(sections[i])
                break
              }
            }

            lastScrollY = currentScrollY
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const sections = [
    { id: "home", label: "Home" },
    { id: "benefits", label: "Benefits" },
    { id: "how-it-works", label: "How It Works" },
    { id: "contact", label: "Contact" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-sm py-3" : "bg-gray-50 py-4"
      }`}
      role="banner"
    >
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 focus-ring rounded-md p-1 hover-scale-sm"
            aria-label="SONIC AI Home"
          >
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center transition-all duration-300">
              <Mic className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-gray-900">SONIC AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="Main navigation">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`group relative text-gray-700 hover:text-blue-600 font-medium text-lg focus-ring px-2 py-1 min-h-[44px] min-w-[44px] transition-all duration-300 ${
                  activeSection === section.id ? "text-blue-600" : ""
                }`}
                aria-current={activeSection === section.id ? "page" : undefined}
                aria-label={`Navigate to ${section.label} section`}
              >
                {section.label}
                {/* Active indicator underline */}
                <span
                  className={`absolute bottom-[-8px] left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out ${
                    activeSection === section.id ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                  }`}
                  aria-hidden="true"
                />
                {/* Hover indicator */}
                <span
                  className={`absolute bottom-[-8px] left-0 right-0 h-[2px] bg-blue-400 rounded-full transition-all duration-300 ease-out opacity-0 scale-x-0 ${
                    activeSection !== section.id ? "group-hover:opacity-50 group-hover:scale-x-100" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => scrollToSection("contact")}
              className="btn-hover-primary bg-blue-600 hover:bg-blue-700 text-white hidden sm:flex focus-ring min-h-[44px]"
              aria-label="Get started with SONIC AI"
            >
              Get Started
            </Button>

            <MobileMenu sections={sections} />
          </div>
        </div>
      </div>
    </header>
  )
}
