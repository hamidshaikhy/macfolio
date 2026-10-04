import { useEffect, useState } from "react";
import { useOS } from "../state/os";
const mobileQuery = "(max-width: 767px), (pointer: coarse) and (max-width: 1024px) and (max-height: 500px)";
export function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
export function useMobile() {
  const [mobile, setMobile] = useState(
    () => matchMedia(mobileQuery).matches,
  );
  useEffect(() => {
    const q = matchMedia(mobileQuery);
    const fn = () => setMobile(q.matches);
    q.addEventListener("change", fn);
    return () => q.removeEventListener("change", fn);
  }, []);
  return mobile;
}
export function tehranDate(now: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    ...options,
  }).format(now);
}
export function useReducedMotion() {
  const preference = useOS(s => s.reducedMotion);
  const [system, setSystem] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => { const query = matchMedia("(prefers-reduced-motion: reduce)"); const change = () => setSystem(query.matches); query.addEventListener("change", change); return () => query.removeEventListener("change", change); }, []);
  return preference || system;
}
