import { getCarById } from "./carService";

let currentPostingCarId = null;

export function startPosting(car) {
  currentPostingCarId = car?.id || null;
  return getCurrentPosting();
}

export function getCurrentPosting() {
  return currentPostingCarId ? getCarById(currentPostingCarId) : null;
}

export function clearPosting() {
  currentPostingCarId = null;
}
