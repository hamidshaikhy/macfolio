import { useEffect, useState } from "react";
import { calculatorInput, initialCalculator } from "../lib/calculator";
import { useOS } from "../state/os";
import { useMobile } from "../lib/hooks";
import { Delete } from "lucide-react";
const keyMap: Record<string, string> = { "*": "×", "/": "÷", "-": "−", Enter: "=", "=": "=", Escape: "AC" };
export default function Calculator() {
  const [state, setState] = useState(initialCalculator);
  const [pressed, setPressed] = useState("");
  const mobile = useMobile();
  const active = useOS(s => s.windows.filter(w => !w.minimized).at(-1)?.app);
  const mobileApp = useOS(s => s.mobileApp);
  const locked = useOS(s => s.locked);
  const panel = useOS(s => s.panel);
  const input = (key: string) => setState(s => calculatorInput(s, key));
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (locked || panel || (mobile ? mobileApp !== "calculator" : active !== "calculator") || event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).closest("input,textarea,[contenteditable=true]")) return;
      const key = keyMap[event.key] || event.key;
      if (!/^[\d.+%×÷−=]$/.test(key) && !["Backspace", "AC"].includes(key)) return;
      event.preventDefault();
      setState(s => calculatorInput(s, key));
      setPressed(key);
    };
    const up = () => setPressed("");
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", up); };
  }, [active, mobileApp, locked, panel, mobile]);
  return <div className="calculator-app">
    <div className="calculator-display"><span>{state.expression || "\u00a0"}</span><output aria-live="polite" aria-label="Calculator display" style={{ fontSize: state.display.length > 10 ? 30 : undefined }}>{state.display}</output>{state.display === "Error" && <small>Press AC to start again.</small>}</div>
    <div className="calculator-keys">{["Backspace", "AC", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "±", "0", ".", "="].map(key => <button key={key} className={`${["÷", "×", "−", "+", "="].includes(key) ? "operator" : ["Backspace", "AC", "±", "%"].includes(key) ? "utility" : "digit"} ${key === "0" ? "zero" : ""} ${pressed === key ? "pressed" : ""} ${state.operator === key && state.waiting ? "pending" : ""}`} aria-label={key === "Backspace" ? "Backspace" : key === "±" ? "Toggle sign" : key === "AC" ? (state.display !== "0" && state.display !== "Error" ? "Clear entry" : "All clear") : key === "%" ? "Percent" : key} onClick={() => input(key === "AC" && state.display !== "0" && state.display !== "Error" ? "C" : key)}>{key === "Backspace" ? <Delete size={25} strokeWidth={1.8} /> : key === "AC" && state.display !== "0" && state.display !== "Error" ? "C" : key}</button>)}</div>
  </div>;
}
