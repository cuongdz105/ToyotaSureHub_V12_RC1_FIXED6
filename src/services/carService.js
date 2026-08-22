import {
  createCarInSupabase,
  updateCarInSupabase,
  deleteCarFromSupabase,
  markCarAsSoldInSupabase,
  restoreSoldCarInSupabase,
  getCarByIdFromSupabase,
  getCarsFromSupabase,
  getSoldDaysRemainingFromSupabase,
  SOLD_STATUS,
  ACTIVE_STATUS,
} from "./carSupabaseService";
import {
  getStoreState,
  setStoreData,
  patchStoreItem,
  removeStoreItem,
  insertStoreItem,
} from "./appDataStore";

export { SOLD_STATUS, ACTIVE_STATUS };

export function getCars() {
  return getStoreState().cars;
}

export function getCarById(id) {
  return getStoreState().cars.find(
    (car) => String(car.id) === String(id)
  ) || null;
}

export async function refreshCars() {
  const cars = await getCarsFromSupabase();
  setStoreData("cars", cars);
  return cars;
}

export async function addCar(car) {
  const created = await createCarInSupabase({
    ...car,
    status: car.status || ACTIVE_STATUS,
    soldAt: null,
  });
  insertStoreItem("cars", created);
  return created;
}

export async function updateCar(id, updatedData) {
  const updated = await updateCarInSupabase(id, updatedData);
  patchStoreItem("cars", id, () => updated);
  return updated;
}

export async function markCarAsSold(id) {
  const updated = await markCarAsSoldInSupabase(id);
  patchStoreItem("cars", id, () => updated);
  return updated;
}

export async function restoreSoldCar(id) {
  const restored = await restoreSoldCarInSupabase(id);
  removeStoreItem("cars", id);
  insertStoreItem("cars", restored);
  return restored;
}

export async function deleteCar(id) {
  await deleteCarFromSupabase(id);
  removeStoreItem("cars", id);
  return true;
}

export function getSoldCars() {
  return getStoreState().cars.filter((car) => car.status === SOLD_STATUS);
}

export function getActiveCars() {
  return getStoreState().cars.filter((car) => car.status !== SOLD_STATUS);
}

export function getSoldDaysRemaining(car) {
  return getSoldDaysRemainingFromSupabase(car);
}
