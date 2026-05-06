"use client";

import React, { useContext } from "react";
import { Button } from "@/components/ui/button";
import { UserDetailContext } from "@/context/UserDetailContext";
import {
  IconCheck,
  IconX,
  IconStethoscope,
  IconCrown,
  IconDiamond,
} from "@tabler/icons-react";
import Link from "next/link";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic consultations",
    credits: 5,
    icon: <IconStethoscope className="h-8 w-8 text-blue-500" />,
    featured: false,
    features: [
      { text: "5 consultation credits", included: true },
      { text: "General Physician access", included: true },
      { text: "Voice-powered consultations", included: true },
      { text: "Basic medical reports", included: true },
      { text: "Specialist doctor access", included: false },
      { text: "Unlimited consultations", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/ month",
    description: "Unlock all specialists & more credits",
    credits: 50,
    icon: <IconCrown className="h-8 w-8 text-yellow-500" />,
    featured: true,
    features: [
      { text: "50 consultation credits / month", included: true },
      { text: "General Physician access", included: true },
      { text: "Voice-powered consultations", included: true },
      { text: "Detailed medical reports", included: true },
      { text: "All 10 specialist doctors", included: true },
      { text: "Consultation history", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$49",
    period: "/ month",
    description: "Everything unlimited with priority support",
    credits: -1,
    icon: <IconDiamond className="h-8 w-8 text-purple-500" />,
    featured: false,
    features: [
      { text: "Unlimited consultation credits", included: true },
      { text: "General Physician access", included: true },
      { text: "Voice-powered consultations", included: true },
      { text: "Detailed medical reports", included: true },
      { text: "All 10 specialist doctors", included: true },
      { text: "Consultation history", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

function PricingPage() {
  const { userDetail } = useContext(UserDetailContext);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center pt-16 pb-10 px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Simple, transparent{" "}
          <span className="text-primary">pricing</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your needs. Get instant access to AI-powered
          medical consultations with voice agents.
        </p>
        {userDetail?.credits !== undefined && (
          <p className="mt-2 text-sm text-muted-foreground">
            You currently have{" "}
            <span className="font-semibold text-primary">
              {userDetail.credits}
            </span>{" "}
            credits remaining.
          </p>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border bg-card p-8 flex flex-col ${
              plan.featured
                ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-border"
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              {plan.icon}
              <h2 className="text-xl font-semibold">{plan.name}</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              {plan.description}
            </p>

            <div className="mb-8">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground ml-1">{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm">
                  {feature.included ? (
                    <IconCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <IconX className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      feature.included ? "" : "text-muted-foreground/60"
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${
                plan.featured
                  ? ""
                  : "variant-outline bg-background hover:bg-accent"
              }`}
              variant={plan.featured ? "default" : "outline"}
              asChild
            >
              <Link href="/dashboard">
                {plan.id === "free" ? "Get Started" : "Upgrade Now"}
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "What are consultation credits?",
              a: "Each credit allows you to have one voice consultation with an AI doctor. The consultation includes a real-time voice conversation and an auto-generated medical report.",
            },
            {
              q: "Can I access specialist doctors on the Free plan?",
              a: "The Free plan includes access to the General Physician only. Upgrade to Pro or Premium to consult with all 10 specialist doctors including Cardiologist, Dermatologist, Psychologist, and more.",
            },
            {
              q: "How does the voice consultation work?",
              a: "Our AI doctors use advanced speech-to-text and text-to-speech technology. You speak naturally, and the AI doctor listens, asks follow-up questions, and provides medical guidance — just like a real consultation.",
            },
            {
              q: "Are the medical reports reliable?",
              a: "Our reports are AI-generated summaries of your consultation including symptoms, recommendations, and severity assessment. They are meant for informational purposes and should not replace professional medical advice.",
            },
            {
              q: "Can I cancel my subscription anytime?",
              a: "Yes, you can cancel your subscription at any time. Your credits and access will remain active until the end of your billing period.",
            },
          ].map((faq, idx) => (
            <div key={idx} className="border rounded-xl p-5">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
