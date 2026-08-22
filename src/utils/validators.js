export function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

export function isPositiveNumber(value) {
  return Number(value) > 0;
}

export function isYear(year) {
  return Number(year) >= 1990 && Number(year) <= 2035;
}