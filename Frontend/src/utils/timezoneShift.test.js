import { getCurrentAttendanceDate } from "./timezone";

afterEach(() => {
  jest.useRealTimers();
});

test.each([
  ["2026-11-24T18:59:00Z", "2026-11-24"],
  ["2026-11-24T19:00:00Z", "2026-11-24"],
  ["2026-11-25T00:59:00Z", "2026-11-24"],
  ["2026-11-25T01:00:00Z", "2026-11-25"],
  ["2027-01-01T00:00:00Z", "2026-12-31"],
])("uses the Pakistan attendance date at %s", (now, expected) => {
  jest.useFakeTimers().setSystemTime(new Date(now));
  expect(getCurrentAttendanceDate()).toBe(expected);
});
