"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrialSignupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TrialSignupModal({ isOpen, onClose }: TrialSignupModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    plan: "starter",
    terms: false,
    marketing: false,
  })

  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Focus management
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      // Focus first input after modal opens
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: false }))
  }

  const handleSelectPlan = (planId: string) => {
    setFormData((prev) => ({ ...prev, plan: planId }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
    setFormErrors((prev) => ({ ...prev, [name]: false }))
  }

  const validateForm = () => {
    const errors = {
      firstName: !formData.firstName.trim(),
      lastName: !formData.lastName.trim(),
      email: !formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email),
      phone: !formData.phone.trim() || !/^[+]?[(]?[0-9\s\-$$$$]{10,}$/.test(formData.phone.replace(/\s/g, "")),
      company: !formData.company.trim(),
      terms: !formData.terms,
    }

    setFormErrors(errors)

    // Focus first error field for better UX
    const firstErrorField = Object.keys(errors).find((key) => errors[key as keyof typeof errors])
    if (firstErrorField) {
      const errorElement = document.getElementById(firstErrorField)
      errorElement?.focus()
    }

    return !Object.values(errors).some(Boolean)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Trial signup:", formData)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Signup error:", error)
      // Handle error state
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      plan: "starter",
      terms: false,
      marketing: false,
    })
    setFormErrors({})
    setIsSubmitted(false)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    onClose()
    setTimeout(resetForm, 300)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <Card
        ref={modalRef}
        className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto focus:outline-none"
        tabIndex={-1}
      >
        <CardHeader className="relative p-4 sm:p-6">
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 p-2 hover:bg-gray-100 rounded-full transition-colors focus-ring min-h-[44px] min-w-[44px] hover-scale click-shrink"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-center justify-center mb-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-[#0A64BC] to-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden="true" />
            </div>
          </div>
          <CardTitle id="modal-title" className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Start Your 7-Day Free Trial
          </CardTitle>
          <p className="text-center text-gray-600 text-sm sm:text-base md:text-lg">
            Get started with SONIC AI today. Choose your plan and begin your trial.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
              {/* Plan Selection */}
              <fieldset className="space-y-3 sm:space-y-4">
                <legend className="text-base sm:text-lg font-semibold">Choose Your Plan</legend>
                <div
                  className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4"
                  role="radiogroup"
                  aria-labelledby="plan-selection"
                >
                  {[
                    {
                      id: "starter",
                      name: "Starter",
                      price: "$29",
                      period: "/month",
                      features: ["100 calls/month", "Basic analytics", "Email support"],
                      popular: false,
                    },
                    {
                      id: "professional",
                      name: "Professional",
                      price: "$99",
                      period: "/month",
                      features: ["1,000 calls/month", "Advanced analytics", "Priority support", "Custom integrations"],
                      popular: true,
                    },
                    {
                      id: "enterprise",
                      name: "Enterprise",
                      price: "$299",
                      period: "/month",
                      features: ["Unlimited calls", "Custom integrations", "Dedicated support", "White-label option"],
                      popular: false,
                    },
                  ].map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 cursor-pointer transition-all duration-300 focus-ring card-hover ${
                        formData.plan === plan.id
                          ? "border-[#0A64BC] bg-blue-50 shadow-lg scale-[1.02]"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                      onClick={() => handleSelectPlan(plan.id)}
                      role="radio"
                      aria-checked={formData.plan === plan.id}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleSelectPlan(plan.id)
                        }
                      }}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <span className="bg-gradient-to-r from-[#0A64BC] to-blue-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-md">
                            Most Popular
                          </span>
                        </div>
                      )}
                      <div className={`text-center ${plan.popular ? "pt-2 sm:pt-3" : ""}`}>
                        <h3 className="font-bold text-sm sm:text-base md:text-lg">{plan.name}</h3>
                        <div className="mt-1 sm:mt-2">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0A64BC]">{plan.price}</span>
                          <span className="text-gray-600 text-sm sm:text-base">{plan.period}</span>
                        </div>
                        <ul className="mt-2 sm:mt-4 space-y-1 sm:space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center text-xs sm:text-sm">
                              <Check
                                className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-500 flex-shrink-0"
                                aria-hidden="true"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Personal Information */}
              <fieldset className="space-y-3 sm:space-y-4">
                <legend className="text-base sm:text-lg font-semibold">Account Information</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className={cn("text-sm sm:text-base", formErrors.firstName && "text-red-500")}
                    >
                      First Name *
                    </Label>
                    <Input
                      ref={firstInputRef}
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={cn("h-10 sm:h-12", formErrors.firstName && "border-red-500")}
                      aria-invalid={formErrors.firstName}
                      aria-describedby={formErrors.firstName ? "firstName-error" : undefined}
                      required
                    />
                    {formErrors.firstName && (
                      <p id="firstName-error" className="text-red-500 text-xs sm:text-sm" role="alert">
                        First name is required
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className={cn("text-sm sm:text-base", formErrors.lastName && "text-red-500")}
                    >
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={cn("h-10 sm:h-12", formErrors.lastName && "border-red-500")}
                      aria-invalid={formErrors.lastName}
                      aria-describedby={formErrors.lastName ? "lastName-error" : undefined}
                      required
                    />
                    {formErrors.lastName && (
                      <p id="lastName-error" className="text-red-500 text-xs sm:text-sm" role="alert">
                        Last name is required
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className={cn("text-sm sm:text-base", formErrors.email && "text-red-500")}>
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={cn("h-10 sm:h-12", formErrors.email && "border-red-500")}
                    aria-invalid={formErrors.email}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                    required
                  />
                  {formErrors.email && (
                    <p id="email-error" className="text-red-500 text-xs sm:text-sm" role="alert">
                      Valid email address is required
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className={cn("text-sm sm:text-base", formErrors.phone && "text-red-500")}>
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={cn("h-10 sm:h-12", formErrors.phone && "border-red-500")}
                      aria-invalid={formErrors.phone}
                      aria-describedby={formErrors.phone ? "phone-error" : undefined}
                      required
                    />
                    {formErrors.phone && (
                      <p id="phone-error" className="text-red-500 text-xs sm:text-sm" role="alert">
                        Phone number is required
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="company"
                      className={cn("text-sm sm:text-base", formErrors.company && "text-red-500")}
                    >
                      Company Name *
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Acme Corp"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={cn("h-10 sm:h-12", formErrors.company && "border-red-500")}
                      aria-invalid={formErrors.company}
                      aria-describedby={formErrors.company ? "company-error" : undefined}
                      required
                    />
                    {formErrors.company && (
                      <p id="company-error" className="text-red-500 text-xs sm:text-sm" role="alert">
                        Company name is required
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Terms and Marketing */}
              <fieldset className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.terms}
                    onCheckedChange={(checked) => handleCheckboxChange("terms", checked as boolean)}
                    className={cn("mt-0.5", formErrors.terms && "border-red-500")}
                    aria-invalid={formErrors.terms}
                    aria-describedby={formErrors.terms ? "terms-error" : undefined}
                    required
                  />
                  <Label
                    htmlFor="terms"
                    className={cn("text-xs sm:text-sm leading-relaxed", formErrors.terms && "text-red-500")}
                  >
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-[#0A64BC] hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 rounded"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-[#0A64BC] hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 rounded"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>
                {formErrors.terms && (
                  <p id="terms-error" className="text-red-500 text-xs sm:text-sm ml-5 sm:ml-6" role="alert">
                    You must agree to the terms to continue
                  </p>
                )}

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={formData.marketing}
                    onCheckedChange={(checked) => handleCheckboxChange("marketing", checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="marketing" className="text-xs sm:text-sm leading-relaxed">
                    Send me product updates and marketing emails
                  </Label>
                </div>
              </fieldset>

              {/* Trial Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-200">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-[#0A64BC] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#0A64BC] mb-1 sm:mb-2 text-sm sm:text-base">7-Day Free Trial</h4>
                    <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                      <li>• Full access to all features</li>
                      <li>• Cancel anytime during trial</li>
                      <li>• Setup assistance included</li>
                      <li>• Charges apply after trial period</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-hover-primary bg-gradient-to-r from-[#0A64BC] to-blue-600 hover:from-[#0954A0] to-blue-700 text-white py-3 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus-ring"
                aria-describedby="submit-button-description"
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      aria-hidden="true"
                    />
                    Processing...
                  </>
                ) : (
                  "Start My Free Trial"
                )}
              </Button>
              <p id="submit-button-description" className="sr-only">
                Submit the form to start your 7-day free trial
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4 sm:space-y-6 py-6 sm:py-8" role="alert" aria-live="polite">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome to SONIC AI!</h3>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                  Your 7-day free trial has started. Check your email for setup instructions.
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-200">
                <h4 className="font-semibold text-[#0A64BC] mb-2 text-sm sm:text-base">What's Next?</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 text-left">
                  <li>• Check your email for login credentials</li>
                  <li>• Complete the onboarding process</li>
                  <li>• Schedule a setup call with our team</li>
                  <li>• Start creating your first voice agent</li>
                </ul>
              </div>
              <Button
                onClick={handleClose}
                className="btn-hover-primary bg-[#0A64BC] hover:bg-[#0954A0] px-6 sm:px-8 text-sm sm:text-base min-h-[44px] focus-ring"
              >
                Get Started
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
