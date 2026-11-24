import { calculateProductivityMinutes } from "./productivity";

describe("calculateProductivityMinutes", () => {
  test("subtracts breaks and desktop idle from gross working time", () => {
    expect(calculateProductivityMinutes({
      grossMinutes: 480,
      breakMinutes: 45,
      idleMinutes: 30,
    })).toEqual({
      productiveMinutes: 405,
      unproductiveMinutes: 75,
    });
  });

  test("does not produce negative productive time for inconsistent totals", () => {
    expect(calculateProductivityMinutes({
      grossMinutes: 60,
      breakMinutes: 45,
      idleMinutes: 30,
    })).toEqual({
      productiveMinutes: 0,
      unproductiveMinutes: 75,
    });
  });

  test("treats missing or negative input minutes as zero", () => {
    expect(calculateProductivityMinutes({
      grossMinutes: 0,
      breakMinutes: -5,
      idleMinutes: undefined,
    })).toEqual({
      productiveMinutes: 0,
      unproductiveMinutes: 0,
    });
  });
});
