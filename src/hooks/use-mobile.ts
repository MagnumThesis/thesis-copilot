import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * @function useIsMobile
 * @description A hook that determines if the current viewport width is considered mobile.
 * It listens for window resize events and updates its state accordingly.
 * @returns {boolean} `true` if the current viewport width is less than `MOBILE_BREAKPOINT`, `false` otherwise.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
