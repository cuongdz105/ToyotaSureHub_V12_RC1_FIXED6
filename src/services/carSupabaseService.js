import { supabase } from "../lib/supabase";


// ==========================================
// CONSTANTS
// ==========================================

const SOLD_STATUS = "🔴 Đã bán";
const ACTIVE_STATUS = "🟢 Đang bán";

const SOLD_RETENTION_DAYS = 30;

const SOLD_RETENTION_MS =
  SOLD_RETENTION_DAYS *
  24 *
  60 *
  60 *
  1000;


const CAR_IMAGE_BUCKET = "car-images";

function dataUrlToBlob(dataUrl) {
  const [header, base64] = String(dataUrl).split(",");
  if (!header || !base64) return null;
  const mime = header.match(/data:([^;]+);base64/i)?.[1] || "image/jpeg";
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function mapCarImage(row) {
  return {
    id: row.id,
    preview: row.public_url || "",
    url: row.public_url || "",
    name: row.file_name || "",
    storagePath: row.storage_path || "",
    isCover: row.is_cover === true,
    sortOrder: row.sort_order || 0,
  };
}

async function getImagesForCar(carId) {
  const { data, error } = await supabase
    .from("car_images")
    .select("*")
    .eq("car_id", carId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCarImage);
}

async function syncCarImages(carId, images = []) {
  const incoming = Array.isArray(images) ? images : [];
  const { data: existing, error: existingError } = await supabase
    .from("car_images")
    .select("*")
    .eq("car_id", carId);
  if (existingError) throw existingError;

  const existingRows = existing || [];
  const incomingExistingIds = new Set(
    incoming.map((img) => img.id).filter((id) => existingRows.some((row) => String(row.id) === String(id)))
  );

  const removed = existingRows.filter((row) => !incomingExistingIds.has(row.id));
  for (const row of removed) {
    if (row.storage_path) {
      await supabase.storage.from(CAR_IMAGE_BUCKET).remove([row.storage_path]);
    }
  }
  if (removed.length) {
    const { error } = await supabase.from("car_images").delete().eq("car_id", carId).in("id", removed.map((row) => row.id));
    if (error) throw error;
  }

  for (let index = 0; index < incoming.length; index += 1) {
    const image = incoming[index];
    if (image.id && existingRows.some((row) => String(row.id) === String(image.id)) && !String(image.preview || "").startsWith("data:")) {
      const { error } = await supabase.from("car_images").update({ sort_order: index, is_cover: index === 0 }).eq("id", image.id);
      if (error) throw error;
      continue;
    }

    const blob = String(image.preview || "").startsWith("data:") ? dataUrlToBlob(image.preview) : null;
    if (!blob) continue;
    const safeName = String(image.name || `car-${index}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${carId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(CAR_IMAGE_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicData } = supabase.storage.from(CAR_IMAGE_BUCKET).getPublicUrl(path);
    const { error: insertError } = await supabase.from("car_images").insert({
      car_id: carId,
      storage_path: path,
      public_url: publicData.publicUrl,
      file_name: safeName,
      mime_type: blob.type,
      file_size: blob.size,
      sort_order: index,
      is_cover: index === 0,
    });
    if (insertError) throw insertError;
  }

  return getImagesForCar(carId);
}


// ==========================================
// CONVERT SUPABASE CAR → APP CAR
// ==========================================

function mapSupabaseCar(car) {
  if (!car) {
    return null;
  }

  return {
    id: car.id,

    brand: car.brand || "",
    model: car.model || "",
    version: car.version || "",

    year: car.year ?? null,
    color: car.color || "",
    odo: car.odo ?? 0,
    price: car.price ?? 0,

    warranty: car.warranty || "",
    legal: car.legal || "",

    status:
      car.status ||
      ACTIVE_STATUS,

    soldAt:
      car.sold_at ||
      null,

    notes:
      car.notes ||
      "",

    // Toyota Sure quality commitments are stored in metadata so
    // they survive every Supabase read/update cycle.
    checked:
      car.metadata?.checked ?? true,
    accidentFree:
      car.metadata?.accidentFree ?? true,
    engineOriginal:
      car.metadata?.engineOriginal ?? true,
    floodFree:
      car.metadata?.floodFree ?? true,
    fineFree:
      car.metadata?.fineFree ?? true,

    images:
      [],

    aiContent:
      car.metadata?.aiContent || {},

    campaignIds:
      car.metadata?.campaignIds || [],

    queueJobIds:
      car.metadata?.queueJobIds || [],

    workPlanIds:
      car.metadata?.workPlanIds || [],

    createdAt:
      car.created_at ||
      null,

    updatedAt:
      car.updated_at ||
      null,

    metadata:
      car.metadata ||
      {},
  };
}


// ==========================================
// CONVERT APP CAR → SUPABASE
// ==========================================

function mapCarToSupabase(car) {
  return {
    brand: car.brand || "",
    model: car.model || "",
    version: car.version || "",

    year: car.year ?? null,
    color: car.color || "",

    odo:
      Number(car.odo) || 0,

    price:
      Number(car.price) || 0,

    warranty:
      car.warranty || "",

    legal:
      car.legal || "",

    status:
      car.status ||
      ACTIVE_STATUS,

    sold_at:
      car.soldAt ||
      null,

    notes:
      car.notes ||
      "",

    metadata: {
      ...(car.metadata || {}),

      // Keep the form's Toyota Sure checklist persistent in Supabase.
      checked:
        car.checked ??
        car.metadata?.checked ??
        true,
      accidentFree:
        car.accidentFree ??
        car.metadata?.accidentFree ??
        true,
      engineOriginal:
        car.engineOriginal ??
        car.metadata?.engineOriginal ??
        true,
      floodFree:
        car.floodFree ??
        car.metadata?.floodFree ??
        true,
      fineFree:
        car.fineFree ??
        car.metadata?.fineFree ??
        true,

      aiContent:
        car.aiContent ||
        {},

      campaignIds:
        car.campaignIds ||
        [],

      queueJobIds:
        car.queueJobIds ||
        [],

      workPlanIds:
        car.workPlanIds ||
        [],
    },
  };
}


// ==========================================
// GET ALL CARS
// ==========================================

export async function getCarsFromSupabase() {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const cars = (data || []).map(mapSupabaseCar);
  const ids = cars.map((car) => car.id);
  if (!ids.length) return cars;

  const { data: imageRows, error: imageError } = await supabase
    .from("car_images")
    .select("*")
    .in("car_id", ids)
    .order("sort_order", { ascending: true });
  if (imageError) throw imageError;

  const grouped = new Map();
  (imageRows || []).forEach((row) => {
    const list = grouped.get(row.car_id) || [];
    list.push(mapCarImage(row));
    grouped.set(row.car_id, list);
  });

  return cars.map((car) => ({
    ...car,
    images: grouped.get(car.id) || [],
  }));
}


// ==========================================
// GET CAR BY ID
// ==========================================

export async function getCarByIdFromSupabase(id) {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const car = mapSupabaseCar(data);
  return { ...car, images: await getImagesForCar(id) };
}


// ==========================================
// CREATE CAR
// ==========================================
//
// Supabase tự tạo UUID.
// Không truyền id từ LocalStorage.
// ==========================================

export async function createCarInSupabase(
  car
) {
  const payload =
    mapCarToSupabase(
      car
    );

  const {
    data,
    error,
  } = await supabase
    .from("cars")
    .insert(
      payload
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  const created = mapSupabaseCar(data);
  if (Array.isArray(car.images) && car.images.length) {
    created.images = await syncCarImages(data.id, car.images);
  }
  return created;
}


// ==========================================
// UPDATE CAR
// ==========================================

export async function updateCarInSupabase(
  id,
  updatedData
) {

  // Đọc bản hiện tại trước để không
  // làm mất metadata khác.

  const {
    data: existingCar,
    error: readError,
  } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (!existingCar) {
    throw new Error(
      "Không tìm thấy xe trên Supabase."
    );
  }


  const currentCar =
    mapSupabaseCar(
      existingCar
    );


  const mergedCar = {
    ...currentCar,
    ...updatedData,

    aiContent: {
      ...(currentCar.aiContent || {}),
      ...(updatedData.aiContent || {}),
    },

    campaignIds:
      updatedData.campaignIds ??
      currentCar.campaignIds ??
      [],

    queueJobIds:
      updatedData.queueJobIds ??
      currentCar.queueJobIds ??
      [],

    workPlanIds:
      updatedData.workPlanIds ??
      currentCar.workPlanIds ??
      [],
  };


  const payload =
    mapCarToSupabase(
      mergedCar
    );


  const {
    data,
    error,
  } = await supabase
    .from("cars")
    .update(
      payload
    )
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const updated = mapSupabaseCar(data);
  if (Object.prototype.hasOwnProperty.call(updatedData, "images")) {
    updated.images = await syncCarImages(id, updatedData.images || []);
  } else {
    updated.images = await getImagesForCar(id);
  }
  return updated;
}


// ==========================================
// MARK CAR AS SOLD
// ==========================================

export async function markCarAsSoldInSupabase(
  id
) {

  const soldAt =
    new Date().toISOString();


  const {
    data,
    error,
  } = await supabase
    .from("cars")
    .update({
      status:
        SOLD_STATUS,

      sold_at:
        soldAt,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return { ...mapSupabaseCar(data), images: await getImagesForCar(id) };
}


// ==========================================
// GET SOLD CARS
// ==========================================

export async function getSoldCarsFromSupabase() {
  const cars = await getCarsFromSupabase();
  return cars.filter((car) => car.status === SOLD_STATUS);
}


// ==========================================
// GET ACTIVE CARS
// ==========================================

export async function getActiveCarsFromSupabase() {
  const cars = await getCarsFromSupabase();
  return cars.filter((car) => car.status !== SOLD_STATUS);
}


// ==========================================
// RESTORE SOLD CAR AS NEW CAR
// ==========================================
//
// Tạo record mới.
// Không giữ ID cũ.
// Không mang campaign / queue / workPlan.
// ==========================================

export async function restoreSoldCarInSupabase(
  id
) {

  const oldCar =
    await getCarByIdFromSupabase(
      id
    );


  if (!oldCar) {
    throw new Error(
      "Không tìm thấy xe."
    );
  }


  if (
    oldCar.status !==
    SOLD_STATUS
  ) {
    throw new Error(
      "Xe này không nằm trong mục Đã bán."
    );
  }


  const newCar = {
    ...oldCar,

    id:
      undefined,

    status:
      ACTIVE_STATUS,

    soldAt:
      null,

    campaignIds:
      [],

    queueJobIds:
      [],

    workPlanIds:
      [],

    images:
      oldCar.images || [],
  };


  delete newCar.id;


  const restored = await createCarInSupabase({ ...newCar, images: [] });

  const oldImages = Array.isArray(oldCar.images) ? oldCar.images : [];
  for (let index = 0; index < oldImages.length; index += 1) {
    const image = oldImages[index];
    if (!image.storagePath) continue;
    const newPath = `${restored.id}/${crypto.randomUUID()}-${String(image.name || `image-${index}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: copyError } = await supabase.storage.from(CAR_IMAGE_BUCKET).copy(image.storagePath, newPath);
    if (copyError) throw copyError;
    const { data: publicData } = supabase.storage.from(CAR_IMAGE_BUCKET).getPublicUrl(newPath);
    const { error: insertError } = await supabase.from("car_images").insert({
      car_id: restored.id,
      storage_path: newPath,
      public_url: publicData.publicUrl,
      file_name: image.name || `image-${index}.jpg`,
      sort_order: index,
      is_cover: index === 0,
    });
    if (insertError) throw insertError;
  }

  restored.images = await getImagesForCar(restored.id);
  return restored;
}


// ==========================================
// DELETE CAR
// ==========================================

export async function deleteCarFromSupabase(
  id
) {
  const images = await getImagesForCar(id);

  const storagePaths = images
    .map((image) => image.storagePath)
    .filter(Boolean);

  if (storagePaths.length) {
    const { error: storageError } = await supabase
      .storage
      .from(CAR_IMAGE_BUCKET)
      .remove(storagePaths);

    if (storageError) {
      throw storageError;
    }
  }

  const { error: imageError } = await supabase
    .from("car_images")
    .delete()
    .eq("car_id", id);

  if (imageError) {
    throw imageError;
  }

  const { error } = await supabase
    .from("cars")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}


// ==========================================
// SOLD DAYS REMAINING
// ==========================================

export function getSoldDaysRemainingFromSupabase(
  car
) {

  if (
    !car ||
    car.status !==
      SOLD_STATUS ||
    !car.soldAt
  ) {
    return null;
  }


  const soldTime =
    new Date(
      car.soldAt
    ).getTime();


  if (
    Number.isNaN(
      soldTime
    )
  ) {
    return null;
  }


  const remaining =
    SOLD_RETENTION_MS -
    (
      Date.now() -
      soldTime
    );


  if (
    remaining <= 0
  ) {
    return 0;
  }


  return Math.ceil(
    remaining /
      (
        24 *
        60 *
        60 *
        1000
      )
  );
}


// ==========================================
// EXPORT CONSTANTS
// ==========================================

export {
  SOLD_STATUS,
  ACTIVE_STATUS,
  SOLD_RETENTION_DAYS,
};