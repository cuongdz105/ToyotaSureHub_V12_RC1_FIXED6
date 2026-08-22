export function filterCars(cars, search, statusFilter) {
  return cars
    .filter((car) => {
      const carName =
        `${car.brand} ${car.model} ${car.version}`.toLowerCase();

      const matchSearch =
        carName.includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "Tất cả"
          ? true
          : car.status === statusFilter;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const modelCompare = a.model.localeCompare(
        b.model,
        "vi"
      );

      if (modelCompare !== 0) {
        return modelCompare;
      }

      if (a.year !== b.year) {
        return b.year - a.year;
      }

      return a.odo - b.odo;
    });
}