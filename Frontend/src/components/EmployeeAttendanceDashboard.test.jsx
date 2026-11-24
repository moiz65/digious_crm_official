import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import EmployeeAttendanceDashboard from "./EmployeeAttendanceDashboard";

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { employeeId: "7" }, role: "employee" }),
}));
jest.mock("../utils/timezone", () => ({
  getPakistanDate: () => new Date(2026, 10, 15),
}));
jest.mock("./EmployeeSidebar", () => () => null);
jest.mock("./DashboardComponents", () => ({
  DashboardHeader: () => null,
  RoleBasedNav: () => null,
}));
jest.mock("./AttendanceCorrectionModal", () => () => null);
jest.mock("recharts", () => {
  const React = require("react");
  const Container = ({ children }) => <div>{children}</div>;
  const Chart = ({ children }) => <svg>{children}</svg>;
  const Series = ({ dataKey, hide }) => (
    hide ? null : <g data-testid={`series-${dataKey}`} />
  );
  const Empty = () => null;
  return {
    ResponsiveContainer: Container,
    BarChart: Chart,
    LineChart: Chart,
    Bar: Series,
    Line: Series,
    XAxis: Empty,
    YAxis: Empty,
    CartesianGrid: Empty,
    Tooltip: Empty,
  };
});

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () => url.includes("/attendance/monthly/")
      ? {
        success: true,
        data: [{
          attendance_date: "2026-11-10",
          gross_working_time_minutes: 480,
          total_break_duration_minutes: 30,
          desktop_idle_minutes: 10,
        }],
      }
      : { success: false },
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

test("legend toggles series independently and keeps the selection between chart types", async () => {
  render(<EmployeeAttendanceDashboard />);
  const legend = await screen.findByRole("group", { name: "Daily productivity series" });
  const working = within(legend).getByRole("button", { name: "Working Hours" });
  const productive = within(legend).getByRole("button", { name: "Productive" });
  const unproductive = within(legend).getByRole("button", { name: "Unproductive" });

  expect(working).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByTestId("series-workingMinutes")).toBeInTheDocument();

  fireEvent.click(working);
  fireEvent.click(unproductive);
  expect(working).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByTestId("series-workingMinutes")).not.toBeInTheDocument();
  expect(screen.queryByTestId("series-unproductiveMinutes")).not.toBeInTheDocument();
  expect(screen.getByTestId("series-productiveMinutes")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Line" }));
  expect(screen.queryByTestId("series-workingMinutes")).not.toBeInTheDocument();
  expect(screen.getByTestId("series-productiveMinutes")).toBeInTheDocument();

  fireEvent.click(productive);
  expect(screen.queryByTestId("series-productiveMinutes")).not.toBeInTheDocument();
  fireEvent.click(working);
  expect(working).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByTestId("series-workingMinutes")).toBeInTheDocument();
});
