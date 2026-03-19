"use client"

import { useEffect, useState, useRef } from "react"

interface CountUpProps {
  end: number
  start?: number
  duration?: number
  prefix?: string
  suffix?: string
}

export function CountUp({ end, start = 0, duration = 2000, prefix = "", suffix = "" }: CountUpProps) {
  const [count, setCount] = useState(start)
  const countRef = useRef(start)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    countRef.current = start
    const step = (end - start) / (duration / 16)
    let animationFrame: number

    const updateCount = () => {
      if (countRef.current < end) {
        const newCount = countRef.current + step
        countRef.current = newCount > end ? end : newCount
        setCount(Math.floor(countRef.current))
        animationFrame = requestAnimationFrame(updateCount)
      } else {
        setCount(end)
      }
    }

    animationFrame = requestAnimationFrame(updateCount)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [end, start, duration, isVisible])

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  )
}
