import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTourStore } from '../../stores/tourStore'
import { tourSteps } from '../../lib/tourSteps'
import TooltipBubble from './TooltipBubble'

export default function TourOverlay() {
  const { active, currentStep, next, back, dismiss } = useTourStore()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!active) return

    setTargetRect(null)

    const step = tourSteps[currentStep]
    if (!step) {
      dismiss()
      return
    }

    step.action?.()

    let cancelled = false

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (cancelled) return

        const el = document.querySelector(step.target)
        if (!el) {
          console.warn(`[Tour] step ${currentStep} (${step.id}): target not found: ${step.target} — skipping`)
          next()
          return
        }

        console.log(`[Tour] step ${currentStep} (${step.id}): target found`, el)
        setTargetRect(el.getBoundingClientRect())
      }, 220)
    })

    return () => { cancelled = true }
  }, [active, currentStep])

  useEffect(() => {
    if (!active) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        back()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        dismiss()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [active, next, back, dismiss])

  if (!active || !targetRect) return null

  const step = tourSteps[currentStep]
  if (!step) return null

  return createPortal(
    <TooltipBubble step={step} targetRect={targetRect} />,
    document.body
  )
}
