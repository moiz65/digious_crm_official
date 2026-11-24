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
  const Tooltip = ({ content, ...props }) => (
    <foreignObject>
      <div data-testid="productivity-tooltip">
        {content({
          ...props,
          label: "10 Nov",
          payload: [
            { dataKey: "workingMinutes", name: "Working Hours", value: 480, color: "url(#working-hours-gradient)" },
            { dataKey: "productiveMinutes", name: "Productive", value: 440, color: "url(#productive-time-gradient)" },
            { dataKey: "unproductiveMinutes", name: "Unproductive", value: 40, color: "url(#unproductive-time-gradient)" },
          ],
        })}
      </div>
    </foreignObject>
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
    Tooltip,
    DefaultTooltipContent: jest.requireActual("recharts").DefaultTooltipContent,
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

test("tooltip labels use series colors in both chart types", async () => {
  render(<EmployeeAttendanceDashboard />);

  const checkTooltip = () => {
    const tooltip = within(screen.getByTestId("productivity-tooltip"));
    expect(tooltip.getByText("10 Nov")).toBeInTheDocument();
    expect(tooltip.getByText("Working Hours").closest("li")).toHaveStyle({ color: "#2563eb" });
    expect(tooltip.getByText("Productive").closest("li")).toHaveStyle({ color: "#16a34a" });
    expect(tooltip.getByText("Unproductive").closest("li")).toHaveStyle({ color: "#e11d48" });
    expect(tooltip.getByText("8h")).toBeInTheDocument();
    expect(tooltip.getByText("7h 20m")).toBeInTheDocument();
    expect(tooltip.getByText("40m")).toBeInTheDocument();
  };

  await screen.findByTestId("productivity-tooltip");
  checkTooltip();
  fireEvent.click(screen.getByRole("button", { name: "Line" }));
  checkTooltip();
});
