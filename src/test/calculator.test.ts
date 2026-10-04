import { describe, expect, it } from "vitest";
import { calculatorInput, initialCalculator, type CalculatorState } from "../lib/calculator";
function keys(values: string[], initial: CalculatorState = initialCalculator) { return values.reduce(calculatorInput, initial); }
describe("calculator semantics", () => {
  it("avoids floating point artifacts and permits one decimal", () => {
    expect(keys(["0", ".", "1", "+", "0", ".", "2", "="]).display).toBe("0.3");
    expect(keys([".", ".", "5"]).display).toBe("0.5");
  });
  it("chains left to right, replaces an operator and repeats equals", () => {
    expect(keys(["2", "+", "3", "×", "4", "="]).display).toBe("20");
    expect(keys(["9", "+", "×", "2", "="]).display).toBe("18");
    expect(keys(["2", "+", "3", "=", "=", "="]).display).toBe("11");
  });
  it("uses contextual percentage for addition/subtraction and a fraction for multiplication/division", () => {
    expect(keys(["2", "0", "0", "+", "1", "0", "%", "="]).display).toBe("220");
    expect(keys(["2", "0", "0", "−", "1", "0", "%", "="]).display).toBe("180");
    expect(keys(["2", "0", "0", "×", "1", "0", "%", "="]).display).toBe("20");
    expect(keys(["5", "0", "%"]).display).toBe("0.5");
  });
  it("supports sign, backspace, entry clear and all clear", () => {
    expect(keys(["1", "2", "Backspace", "±", "×", "5", "="]).display).toBe("-5");
    expect(keys(["8", "+", "9", "C", "2", "="]).display).toBe("10");
    expect(keys(["8", "+", "9", "AC", "2", "="]).display).toBe("2");
  });
  it("recovers from zero division and limits input length", () => {
    const error = keys(["9", "÷", "0", "="]);
    expect(error.display).toBe("Error");
    expect(keys(["5", "+", "2", "="], error).display).toBe("7");
    expect(keys(Array(30).fill("9")).display).toHaveLength(12);
  });
  it("starts a fresh calculation after equals and preserves the right operand for a repeat", () => {
    expect(keys(["4", "+", "2", "=", "7", "=", "="]).display).toBe("7");
    expect(keys(["5", "×", "2", "=", "="]).display).toBe("20");
  });
});
