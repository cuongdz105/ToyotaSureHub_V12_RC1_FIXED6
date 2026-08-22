import { getStoreState } from "./appDataStore";

export function getDashboardData() {
  const cars = getStoreState().cars;
  const activeCars = cars.filter((car) => car.status !== "🔴 Đã bán");
  const soldCars = cars.filter((car) => car.status === "🔴 Đã bán");
  const inventoryValue = activeCars.reduce(
    (total, car) => total + Number(car.price || 0),
    0
  );

  return [
    { icon: "🚗", title: "Xe trong kho", value: activeCars.length },
    { icon: "🟢", title: "Đang bán", value: activeCars.length },
    { icon: "🔴", title: "Đã bán", value: soldCars.length },
    { icon: "💰", title: "Tổng giá trị", value: `${inventoryValue} triệu` },
  ];
}
