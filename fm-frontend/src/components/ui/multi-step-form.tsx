import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiStepFormProps {
    steps: {
        title: string
        description: string
        icon?: React.ReactNode
    }[]
    currentStep: number
}

export function MultiStepForm({ steps, currentStep }: MultiStepFormProps) {
    return (
        <nav aria-label="Progress" className="mb-12">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0 md:rtl:space-x-reverse">
                {steps.map((step, index) => (
                    <li key={step.title} className="md:flex-1">
                        <div
                            className={cn(
                                "group flex flex-col border-l-4 md:border-l-0 md:border-t-4 py-2 pl-4 md:pl-0 md:pt-4 md:pb-0",
                                index + 1 <= currentStep
                                    ? "border-primary"
                                    : "border-muted-foreground/20"
                            )}
                        >
                            <span className="text-sm font-medium text-primary flex items-center gap-2">
                                {index + 1 <= currentStep ? (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                                        <Check className="h-5 w-5 text-primary-foreground" />
                                    </span>
                                ) : (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/20">
                                        {index + 1}
                                    </span>
                                )}
                                {step.title}
                                {step.icon}
                            </span>
                            <span className="text-sm text-muted-foreground mt-1">
                                {step.description}
                            </span>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    )
} 