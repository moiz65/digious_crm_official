import { getBreakElapsedSeconds } from "./breakTimer";

describe("getBreakElapsedSeconds", () => {
  test("starts from the server duration and advances locally", () => {
    const breakItem = {
      break_duration_seconds: 0,
      _durationReceivedAt: 10000,
    };

    expect(getBreakElapsedSeconds(breakItem, 10000)).toBe(0);
    expect(getBreakElapsedSeconds(breakItem, 15000)).toBe(5);
  });

  test("uses the legacy minute duration when seconds are unavailable", () => {
    const breakItem = {
      break_duration_minutes: 2,
      _durationReceivedAt: 10000,
    };

    expect(getBreakElapsedSeconds(breakItem, 15000)).toBe(125);
  });

  test("does not use browser clock fields from the break start time", () => {
    const breakItem = {
      break_start_time: "09:00:00",
      break_duration_seconds: 0,
      _durationReceivedAt: 10000,
    };

    expect(getBreakElapsedSeconds(breakItem, 11000)).toBe(1);
  });
});
