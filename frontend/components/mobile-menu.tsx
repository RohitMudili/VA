"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  sections: Array<{
    id: string
    label: string
  }>
}

export function MobileMenu({ sections }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuHeight, setMenuHeight] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState("home")
  const focusTrapRef = useRef<HTMLDivElement>(null)

  // Handle body scroll locking when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      if (menuRef.current) {
        setMenuHeight(window.innerHeight)
      }

      // Improved focus trap
      const focusableElements = focusTrapRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const firstFocusable = focusableElements?.[0] as HTMLElement
      const lastFocusable = focusableElements?.[focusableElements.length - 1] as HTMLElement

      firstFocusable?.focus()

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              lastFocusable?.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastFocusable) {
              firstFocusable?.focus()
              e.preventDefault()
            }
          }
        }
      }

      document.addEventListener("keydown", handleTabKey)
      return () => document.removeEventListener("keydown", handleTabKey)
    } else {
      document.body.style.overflow = ""
      setMenuHeight(null)
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen && menuRef.current) {
        setMenuHeight(window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isOpen])

  // Track active section
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + 100

          for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i].id)
            if (section && section.offsetTop <= scrollPosition) {
              setActiveSection(sections[i].id)
              break
            }
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [sections])

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      setIsOpen(false)
      setTimeout(() => {
        const navbarHeight = 80
        const elementPosition = element.offsetTop - navbarHeight
        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        })
      }, 300)
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden min-h-[44px] min-w-[44px] hover-scale click-shrink focus-ring"
        onClick={() => setIsOpen(true)}
        aria-label="Open main navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-haspopup="true"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* Portal container for menu */}
      <div
        className={cn(
          "fixed inset-0 z-[9999] md:hidden transition-all duration-300 pointer-events-none",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          style={{ opacity: isOpen ? 1 : 0 }}
        />

        {/* Mobile menu panel */}
        <div
          ref={menuRef}
          id="mobile-menu"
          style={{ height: menuHeight ? `${menuHeight}px` : "100%" }}
          className={cn(
            "absolute top-0 right-0 w-[280px] bg-white shadow-xl overflow-auto transition-all duration-300 ease-in-out transform",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          aria-describedby="mobile-menu-description"
        >
          <div ref={focusTrapRef} className="sticky top-0 z-10 flex justify-between items-center p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span id="mobile-menu-title" className="text-xl font-bold">
                SONIC AI
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              className="min-h-[44px] min-w-[44px] hover-rotate click-shrink focus-ring"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </Button>
          </div>

          <nav className="p-4" role="navigation" aria-label="Mobile navigation">
            <ul className="space-y-2 stagger-fade-in">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left py-3 px-4 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus-ring transition-all duration-300 text-gray-700 font-medium min-h-[44px] hover-slide-right click-shrink text-lg relative ${
                      activeSection === section.id ? "bg-blue-50 text-[#0A64BC] border-l-4 border-[#0A64BC]" : ""
                    }`}
                    aria-current={activeSection === section.id ? "page" : undefined}
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sticky bottom-0 left-0 right-0 p-4 border-t bg-white">
            <Button
              onClick={() => scrollToSection("contact")}
              className="w-full btn-hover-primary bg-[#0A64BC] hover:bg-[#0954A0] text-white min-h-[44px] focus-ring"
              aria-label="Get started with SONIC AI"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
