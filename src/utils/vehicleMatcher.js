// =======================================
// ToyotaSureHub Vehicle Matcher
// V11
// =======================================

import { brands } from "../data/brands";

// =======================================
// Chuẩn hóa text
// =======================================

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// =======================================
// Kiểm tra text có chứa từ khóa
// =======================================

function containsKeyword(text, keyword) {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) return false;

  return normalizedText.includes(normalizedKeyword);
}

// =======================================
// Tìm hãng xe
// =======================================

function findBrand(text) {
  const normalizedText = normalizeText(text);

  // Ưu tiên tên hãng dài hơn trước
  const sortedBrands = [...brands].sort(
    (a, b) =>
      normalizeText(b.name).length -
      normalizeText(a.name).length
  );

  for (const brand of sortedBrands) {
    if (
      containsKeyword(
        normalizedText,
        brand.name
      )
    ) {
      return brand;
    }
  }

  return null;
}

// =======================================
// Tìm dòng xe
// =======================================

function findModel(brand, text) {
  if (!brand) return null;

  const normalizedText = normalizeText(text);

  const sortedModels = [...brand.models].sort(
    (a, b) =>
      normalizeText(b.name).length -
      normalizeText(a.name).length
  );

  for (const model of sortedModels) {
    if (
      containsKeyword(
        normalizedText,
        model.name
      )
    ) {
      return model;
    }

    // Kiểm tra alias của version
    for (const version of model.versions) {
      const aliases = version.aliases || [];

      for (const alias of aliases) {
        const normalizedAlias =
          normalizeText(alias);

        // Alias có chứa tên model
        if (
          normalizedAlias.includes(
            normalizeText(model.name)
          ) &&
          normalizedText.includes(
            normalizedAlias
          )
        ) {
          return model;
        }
      }
    }
  }

  return null;
}

// =======================================
// Tìm phiên bản
// =======================================

function findVersion(model, text) {
  if (!model) return null;

  const normalizedText = normalizeText(text);

  let bestVersion = null;
  let bestScore = 0;

  for (const version of model.versions) {
    const candidates = [
      version.name,
      ...(version.aliases || []),
    ];

    for (const candidate of candidates) {
      const normalizedCandidate =
        normalizeText(candidate);

      if (!normalizedCandidate) continue;

      // Match chính xác
      if (
        normalizedText ===
        normalizedCandidate
      ) {
        return version;
      }

      // Text chứa candidate
      if (
        normalizedText.includes(
          normalizedCandidate
        )
      ) {
        const score =
          normalizedCandidate.length;

        if (score > bestScore) {
          bestScore = score;
          bestVersion = version;
        }
      }
    }
  }

  return bestVersion;
}

// =======================================
// Tìm năm
// =======================================

function findYear(text) {
  const matches = String(text).match(
    /\b(19|20)\d{2}\b/g
  );

  if (!matches || matches.length === 0) {
    return "";
  }

  return Number(matches[0]);
}

// =======================================
// Tìm màu
// =======================================

const COLOR_ALIASES = {
  trang: "Trắng",
  den: "Đen",
  bac: "Bạc",
  xam: "Xám",
  ghi: "Ghi",
  xanh: "Xanh",
  do: "Đỏ",
  nau: "Nâu",
  vang: "Vàng",
  kem: "Kem",
};

function findColor(text) {
  const normalizedText =
    normalizeText(text);

  for (const [key, value] of Object.entries(
    COLOR_ALIASES
  )) {
    if (
      normalizedText.includes(key)
    ) {
      return value;
    }
  }

  return "";
}

// =======================================
// MATCH CHÍNH
// =======================================

export function matchVehicle(text = "") {
  if (!text || !String(text).trim()) {
    return {
      matched: false,
      brand: null,
      model: null,
      version: null,
      year: "",
      color: "",
      confidence: 0,
    };
  }

  const brand = findBrand(text);

  if (!brand) {
    return {
      matched: false,
      brand: null,
      model: null,
      version: null,
      year: findYear(text),
      color: findColor(text),
      confidence: 0,
    };
  }

  const model = findModel(
    brand,
    text
  );

  if (!model) {
    return {
      matched: false,
      brand: brand.name,
      model: null,
      version: null,
      year: findYear(text),
      color: findColor(text),
      confidence: 40,
    };
  }

  const version = findVersion(
    model,
    text
  );

  let confidence = 60;

  if (version) {
    confidence = 90;
  }

  if (findYear(text)) {
    confidence += 5;
  }

  if (findColor(text)) {
    confidence += 5;
  }

  if (confidence > 100) {
    confidence = 100;
  }

  return {
    matched: true,

    brand: brand.name,

    model: model.name,

    version: version
      ? version.name
      : "",

    year: findYear(text),

    color: findColor(text),

    confidence,
  };
}

// =======================================
// MATCH TỪ OBJECT AI
// =======================================

export function matchVehicleResult(
  result
) {
  if (!result) {
    return matchVehicle("");
  }

  // Nếu AI trả về string
  if (typeof result === "string") {
    return matchVehicle(result);
  }

  // Nếu AI trả về object
  const text = [
    result.brand,
    result.model,
    result.version,
    result.year,
    result.color,
    result.description,
    result.raw,
  ]
    .filter(Boolean)
    .join(" ");

  const matched =
    matchVehicle(text);

  // Ưu tiên dữ liệu cụ thể AI đã nhận diện
  return {
    ...matched,

    year:
      result.year ||
      matched.year,

    color:
      result.color ||
      matched.color,
  };
}

// =======================================
// DEBUG
// =======================================

export function testVehicleMatcher() {
  const tests = [
    "Toyota Vios G 2022 trắng",
    "Vios G CVT 2022",
    "Toyota Corolla Cross V 2023 trắng",
    "Corolla Cross HEV 2024",
    "Veloz Cross CVT TOP 2023",
    "Avanza Premio CVT 2022",
    "Land Cruiser 300 2023",
    "Land Cruiser Prado 2020",
    "Alphard HEV 2025",
    "Mazda 3 Premium 2020",
    "Honda CRV L 2022",
  ];

  tests.forEach((text) => {
    console.log(
      text,
      "=>",
      matchVehicle(text)
    );
  });
}