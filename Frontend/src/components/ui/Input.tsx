import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightSlot?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightSlot, className, ...props }, ref) => (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        )}
        <input
          ref={ref}
          className={cn(
            "input",
            icon && "pl-9",
            rightSlot && "pr-10",
            error && "border-red-300 focus:ring-red-300",
            className
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
)
Input.displayName = "Input"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div>
      {label && <label className="label">{label}</label>}
      <select ref={ref} className={cn("input", error && "border-red-300", className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
)
Select.displayName = "Select"

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ label, error, className, ...props }, ref) => (
  <div>
    {label && <label className="label">{label}</label>}
    <textarea ref={ref} className={cn("input min-h-[80px]", error && "border-red-300", className)} {...props} />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
))
Textarea.displayName = "Textarea"
