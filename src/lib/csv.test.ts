import { describe, expect, it } from "vitest";
import { quoteCsvCell } from "./csv";

describe("quoteCsvCell", () => {
  it.each(["=SUM(1,1)", "+1+2", "-1+2", "@SUM(1,1)", "\t=SUM(1,1)", "  =SUM(1,1)"])(
    "neutralizes spreadsheet formulas in %j",
    (value) => {
      expect(quoteCsvCell(value)).toBe(`"'${value.replace(/"/g, '""')}"`);
    },
  );

  it("quotes commas and doubles embedded quotes without changing ordinary text", () => {
    expect(quoteCsvCell('user said, "hello"')).toBe('"user said, ""hello"""');
  });
});
