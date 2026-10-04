export type Operator = "+" | "−" | "×" | "÷";
export interface CalculatorState {
  display: string; accumulator: number | null; operator: Operator | null;
  waiting: boolean; last: { operator: Operator; value: number } | null; expression: string;
}
export const initialCalculator: CalculatorState = { display: "0", accumulator: null, operator: null, waiting: false, last: null, expression: "" };
function format(value: number) {
  if (!Number.isFinite(value) || Math.abs(value) > 1e100) return "Error";
  const rounded = Number(value.toPrecision(12));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}
function calculate(a: number, b: number, operator: Operator) {
  return operator === "+" ? a + b : operator === "−" ? a - b : operator === "×" ? a * b : b === 0 ? NaN : a / b;
}
export function calculatorInput(state: CalculatorState, key: string): CalculatorState {
  let s = state;
  if (key === "AC" || key === "Escape") return { ...initialCalculator };
  if (s.display === "Error") { if (/^\d$/.test(key) || key === ".") s = { ...initialCalculator }; else return s; }
  if (/^\d$/.test(key) || key === ".") {
    const fresh = s.waiting;
    const current = fresh ? "0" : s.display;
    if (key === "." && current.includes(".")) return s;
    if (current.replace(/[-.]/g, "").length >= 12 && !fresh && key !== ".") return s;
    const display = key === "." ? current + "." : current === "0" ? key : current === "-0" ? "-" + key : current + key;
    return { ...s, display, waiting: false, last: fresh && !s.operator ? null : s.last, expression: fresh && !s.operator ? "" : s.expression };
  }
  if (key === "C") return { ...s, display: "0", waiting: false };
  if (key === "Backspace") return s.waiting ? s : { ...s, display: s.display.slice(0, -1).replace(/^-$|^$/, "0") };
  if (key === "±") return { ...s, display: s.display === "0" ? "-0" : s.display.startsWith("-") ? s.display.slice(1) : "-" + s.display };
  if (key === "%") {
    const value = Number(s.display);
    const percentage = s.operator && (s.operator === "+" || s.operator === "−") && s.accumulator !== null ? s.accumulator * value / 100 : value / 100;
    return { ...s, display: format(percentage), waiting: false };
  }
  if (["+", "−", "×", "÷"].includes(key)) {
    const value = s.operator && !s.waiting && s.accumulator !== null ? calculate(s.accumulator, Number(s.display), s.operator) : Number(s.display);
    const display = format(value);
    return display === "Error" ? { ...initialCalculator, display } : { ...s, display, accumulator: value, operator: key as Operator, waiting: true, last: null, expression: `${display} ${key}` };
  }
  if (key === "=" || key === "Enter") {
    const op = s.operator || s.last?.operator;
    if (!op) return { ...s, waiting: true };
    const a = s.operator ? s.accumulator ?? Number(s.display) : Number(s.display);
    const b = s.operator ? Number(s.display) : s.last!.value;
    const display = format(calculate(a, b, op));
    return { ...initialCalculator, display, waiting: true, expression: `${format(a)} ${op} ${format(b)} =`, last: display === "Error" ? null : { operator: op, value: b } };
  }
  return s;
}
