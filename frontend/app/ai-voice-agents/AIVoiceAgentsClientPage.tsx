"use client"

import { useEffect } from "react"
import { ArrowLeft, Check, Mic, Clock, Users, TrendingUp, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { VoiceVisualization } from "@/components/voice-visualization"

export default function AIVoiceAgentsClientPage() {
  // Scroll to top when the page loads
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white shadow-sm py-4 sticky top-0 z-40">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center text-gray-700 hover:text-[#0A64BC] transition-colors hover-lift click-shrink focus-ring rounded-md p-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#0A64BC] flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">SONIC AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-16 sm:py-20 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-[#0A64BC] text-white px-4 py-2 text-sm font-medium">Complete Guide 2025</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                What Are <span className="text-[#0A64BC]">AI Voice Agents</span>?
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Discover how AI voice agents are revolutionizing business communications, automating customer
                interactions, and driving unprecedented efficiency across industries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-[#0A64BC] hover:bg-[#0954A0] text-white px-8 py-4 text-lg font-medium hover-glow focus-ring"
                  asChild
                >
                  <a href="#introduction">Start Reading Guide</a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#0A64BC] text-[#0A64BC] hover:bg-[#0A64BC] hover:text-white px-8 py-4 text-lg font-medium focus-ring transition-all duration-300"
                  asChild
                >
                  <a href="#use-cases">View Use Cases</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-xl overflow-hidden bg-[#0f172a] shadow-2xl">
                <div className="w-full aspect-video">
                  <VoiceVisualization darkMode={true} style="circular" intensity={0.8} barCount={24} animated={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="w-full py-12 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { href: "#introduction", title: "1. Introduction to AI Voice Agents" },
                  { href: "#benefits", title: "2. Key Benefits & Advantages" },
                  { href: "#use-cases", title: "3. Real-World Use Cases" },
                  { href: "#faqs", title: "4. Frequently Asked Questions" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-[#0A64BC] focus-ring"
                  >
                    <Check className="h-4 w-4 mr-3 text-[#0A64BC]" />
                    {item.title}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Introduction Section */}
      <section id="introduction" className="w-full py-12 sm:py-16 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Understanding AI Voice Agents</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                AI voice agents are sophisticated software programs that use artificial intelligence to conduct natural,
                human-like conversations over the phone or through voice interfaces.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">What Makes AI Voice Agents Different?</h3>
              <p className="text-gray-700 mb-8">
                Unlike traditional automated phone systems with rigid menu options, AI voice agents leverage advanced
                natural language processing (NLP) and machine learning to understand context, respond appropriately to
                unexpected questions, and maintain conversational flow that feels genuinely human.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-7 w-7 text-[#0A64BC]" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">Natural Conversations</h4>
                  <p className="text-sm text-gray-600">Understands context and responds like a human agent</p>
                </div>
                <div className="text-center">
                  <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-7 w-7 text-[#0A64BC]" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">24/7 Availability</h4>
                  <p className="text-sm text-gray-600">Never sleeps, always ready to assist customers</p>
                </div>
                <div className="text-center">
                  <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-7 w-7 text-[#0A64BC]" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">Continuous Learning</h4>
                  <p className="text-sm text-gray-600">Improves performance with every interaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="w-full py-16 sm:py-20 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Key Benefits of AI Voice Agents</h2>
            <p className="text-xl text-gray-600">
              Discover how AI voice agents transform business operations and customer experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="h-6 w-6" />,
                title: "24/7 Availability",
                description:
                  "Never miss a customer call or opportunity. AI voice agents work around the clock, handling inquiries and appointments even outside business hours.",
                stats: "100% uptime guaranteed",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Scalability",
                description:
                  "Handle unlimited simultaneous calls without hiring additional staff. Scale your customer service capacity instantly during peak periods.",
                stats: "Handle 1000+ concurrent calls",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Cost-Effectiveness",
                description:
                  "Reduce operational costs by up to 85% compared to human agents while maintaining high-quality customer interactions.",
                stats: "85% cost reduction",
              },
              {
                icon: <Check className="h-6 w-6" />,
                title: "Consistency",
                description:
                  "Deliver consistent, high-quality service every time. No bad days, no training gaps, just reliable performance.",
                stats: "98% accuracy rate",
              },
              {
                icon: <Mic className="h-6 w-6" />,
                title: "Instant Response",
                description:
                  "Eliminate wait times and provide immediate assistance. Customers connect instantly without being placed on hold.",
                stats: "0 second wait time",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Multilingual Support",
                description:
                  "Communicate with customers in their preferred language. Support global operations with native-level fluency.",
                stats: "50+ languages supported",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 card-hover"
              >
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-[#0A64BC]">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{benefit.description}</p>
                <div className="bg-blue-50 text-[#0A64BC] px-3 py-1 rounded-full text-sm font-medium inline-block">
                  {benefit.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="w-full py-16 sm:py-20 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Real-World Use Cases</h2>
            <p className="text-xl text-gray-600">See how businesses across industries leverage AI voice agents</p>
          </div>

          <div className="space-y-12">
            {[
              {
                industry: "Healthcare",
                title: "Appointment Scheduling & Patient Follow-ups",
                description:
                  "AI voice agents handle appointment bookings, send reminders, conduct post-visit follow-ups, and collect patient feedback, reducing administrative burden on medical staff.",
                features: [
                  "HIPAA-compliant patient data handling",
                  "Integration with EMR systems",
                  "Automated appointment reminders",
                  "Post-treatment follow-up calls",
                ],
                results: "40% reduction in no-shows, 60% less administrative work",
              },
              {
                industry: "Real Estate",
                title: "Lead Qualification & Property Inquiries",
                description:
                  "Qualify leads, schedule property viewings, follow up with prospects, and provide property information 24/7, ensuring no opportunity is missed.",
                features: [
                  "Lead scoring and qualification",
                  "Property information delivery",
                  "Viewing appointment scheduling",
                  "Market update notifications",
                ],
                results: "300% increase in qualified leads, 50% faster response times",
              },
              {
                industry: "E-commerce",
                title: "Order Support & Customer Service",
                description:
                  "Handle order inquiries, process returns, provide shipping updates, and resolve customer issues without human intervention.",
                features: [
                  "Order status updates",
                  "Return and refund processing",
                  "Product recommendations",
                  "Complaint resolution",
                ],
                results: "70% reduction in support tickets, 90% customer satisfaction",
              },
              {
                industry: "Financial Services",
                title: "Account Management & Collections",
                description:
                  "Conduct payment reminders, account updates, fraud alerts, and basic account inquiries while maintaining strict security protocols.",
                features: [
                  "Payment reminder calls",
                  "Account balance inquiries",
                  "Fraud alert notifications",
                  "Loan application follow-ups",
                ],
                results: "45% improvement in collection rates, 80% cost savings",
              },
            ].map((useCase, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <Badge className="bg-[#0A64BC] text-white mb-4">{useCase.industry}</Badge>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{useCase.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{useCase.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {useCase.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center">
                            <Check className="h-4 w-4 text-[#0A64BC] mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h4 className="font-semibold text-[#0A64BC] mb-3">Results Achieved</h4>
                      <p className="text-gray-700 font-medium">{useCase.results}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="w-full py-16 sm:py-20 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Get answers to common questions about AI voice agents</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "How do AI voice agents differ from traditional IVR systems?",
                answer:
                  "Unlike traditional IVR systems that use pre-recorded menus and limited responses, AI voice agents use natural language processing to understand and respond to complex queries in real-time. They can handle unexpected questions, maintain context throughout conversations, and provide personalized responses based on customer data.",
              },
              {
                question: "What level of accuracy can I expect from AI voice agents?",
                answer:
                  "SONIC AI voice agents achieve 98% accuracy in understanding and responding to customer inquiries. This high accuracy is maintained through continuous learning, regular updates, and industry-specific training. The system also improves over time as it processes more interactions.",
              },
              {
                question: "How quickly can AI voice agents be implemented?",
                answer:
                  "Implementation typically takes 4-8 weeks depending on complexity and integration requirements. This includes system setup, training, testing, and optimization. Simple use cases like appointment scheduling can be deployed faster, while complex integrations may require additional time.",
              },
              {
                question: "Are AI voice agents secure and compliant?",
                answer:
                  "Yes, SONIC AI voice agents are built with enterprise-grade security and comply with industry standards including HIPAA, GDPR, and PCI DSS. All conversations are encrypted, data is securely stored, and access controls ensure only authorized personnel can access sensitive information.",
              },
              {
                question: "Can AI voice agents handle multiple languages?",
                answer:
                  "Yes, our AI voice agents support over 50 languages and can automatically detect the caller's preferred language. They maintain native-level fluency and cultural context in each supported language, making them ideal for global businesses.",
              },
              {
                question: "What happens if the AI can't handle a specific request?",
                answer:
                  "When the AI encounters a complex issue beyond its capabilities, it seamlessly transfers the call to a human agent with full context of the conversation. This ensures customers never feel stuck and always receive appropriate assistance.",
              },
              {
                question: "How much can businesses save with AI voice agents?",
                answer:
                  "Businesses typically see 60-85% reduction in customer service costs while improving service quality. The exact savings depend on call volume, current staffing costs, and implementation scope. Most businesses achieve ROI within 3-6 months.",
              },
              {
                question: "Do customers accept AI voice agents?",
                answer:
                  "Studies show 89% of customers are satisfied with AI voice interactions when they're natural and effective. Our voice agents are designed to sound human-like and focus on solving problems quickly, leading to high customer acceptance rates.",
              },
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg shadow-lg border-0">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-900 hover:text-[#0A64BC] hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600 leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-[#0A64BC] to-blue-700">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
          <div className="space-y-6 text-white">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to Transform Your Business?</h2>
            <p className="text-xl opacity-90">
              Join thousands of businesses already using AI voice agents to improve customer experience and reduce
              costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[#0A64BC] hover:bg-gray-100 border border-white px-8 py-4 text-lg font-medium hover-glow transition-all duration-300"
                asChild
              >
                <Link href="/">Start Free Trial</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-[#0A64BC] px-8 py-4 text-lg font-medium transition-all duration-300"
                asChild
              >
                <Link href="/#contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-gray-900 text-white">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <p>&copy; 2025 SONIC AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
