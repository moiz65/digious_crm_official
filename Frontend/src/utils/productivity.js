const nonNegativeMinutes = (value) => {
  const minutes = Number(value);
  return Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
};

export const calculateProductivityMinutes = ({
  grossMinutes,
  breakMinutes,
  idleMinutes,
}) => {
  const totalWorkingMinutes = nonNegativeMinutes(grossMinutes);
  const unproductiveMinutes = nonNegativeMinutes(breakMinutes)
    + nonNegativeMinutes(idleMinutes);

  return {
    workingMinutes: totalWorkingMinutes,
    productiveMinutes: Math.max(0, totalWorkingMinutes - unproductiveMinutes),
    unproductiveMinutes,
  };
};
