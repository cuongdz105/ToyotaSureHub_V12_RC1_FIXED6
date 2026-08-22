export function formatPrice(price) {
  return `${Number(price).toLocaleString("vi-VN")} triệu`;
}

export function formatOdo(odo) {
  return `${(Number(odo) * 10000).toLocaleString("vi-VN")} km`;
}

export function formatYear(year) {
  return String(year);
}
export function buildCarName(car) {
  return `${car.brand} ${car.model} ${car.version}`;
}