// =======================================
// ToyotaSureHub Vehicle Catalog
// V11 - Base Catalog
// =======================================
//
// Cấu trúc:
// brand
//   └── model
//        └── version
//             ├── aliases
//             ├── fuel
//             ├── gearbox
//             ├── drivetrain
//             └── seats
//
// aliases dùng cho AI Vision mapping.
// Ví dụ:
// "G"
// "Vios G"
// "Vios G CVT"
// -> có thể map về "G CVT"
//
// =======================================

export const brands = [

  // ==================================================
  // TOYOTA
  // ==================================================

  {
    name: "Toyota",

    models: [

      {
        name: "Vios",
        category: "Sedan",

        versions: [
          {
            name: "E MT",
            aliases: ["E", "E MT", "Vios E", "Vios E MT"],
            fuel: "Xăng",
            gearbox: "Số sàn",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "E CVT",
            aliases: ["E CVT", "Vios E CVT"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "G CVT",
            aliases: [
              "G",
              "G CVT",
              "Vios G",
              "Vios G CVT",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "GR-S",
            aliases: [
              "GRS",
              "GR-S",
              "Vios GR-S",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Yaris",
        category: "Hatchback",

        versions: [
          {
            name: "G",
            aliases: ["G", "Yaris G"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Corolla Altis",
        category: "Sedan",

        versions: [
          {
            name: "1.8G",
            aliases: [
              "1.8G",
              "Altis 1.8G",
              "Corolla Altis 1.8G",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.8V",
            aliases: [
              "1.8V",
              "Altis 1.8V",
              "Corolla Altis 1.8V",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.8HEV",
            aliases: [
              "1.8HEV",
              "HEV",
              "Altis HEV",
            ],
            fuel: "Hybrid",
            gearbox: "e-CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Camry",
        category: "Sedan",

        versions: [
          {
            name: "2.0G",
            aliases: [
              "2.0G",
              "Camry 2.0G",
            ],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.0Q",
            aliases: [
              "2.0Q",
              "Camry 2.0Q",
            ],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.5Q",
            aliases: [
              "2.5Q",
              "Camry 2.5Q",
            ],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.5HV",
            aliases: [
              "2.5HV",
              "HV",
              "Camry Hybrid",
              "Camry 2.5HV",
            ],
            fuel: "Hybrid",
            gearbox: "e-CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Corolla Cross",
        category: "SUV",

        versions: [
          {
            name: "1.8G",
            aliases: [
              "1.8G",
              "Cross G",
              "Corolla Cross G",
              "Corolla Cross 1.8G",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.8V",
            aliases: [
              "1.8V",
              "Cross V",
              "Corolla Cross V",
              "Corolla Cross 1.8V",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "HEV",
            aliases: [
              "HEV",
              "Hybrid",
              "Cross HEV",
              "Corolla Cross HEV",
            ],
            fuel: "Hybrid",
            gearbox: "e-CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Yaris Cross",
        category: "SUV",

        versions: [
          {
            name: "Xăng",
            aliases: [
              "Xăng",
              "Yaris Cross Xăng",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "HEV",
            aliases: [
              "HEV",
              "Hybrid",
              "Yaris Cross HEV",
            ],
            fuel: "Hybrid",
            gearbox: "e-CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Raize",
        category: "SUV",

        versions: [
          {
            name: "1.0 Turbo",
            aliases: [
              "1.0 Turbo",
              "Turbo",
              "Raize Turbo",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Innova",
        category: "MPV",

        versions: [
          {
            name: "2.0E",
            aliases: [
              "2.0E",
              "Innova E",
            ],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 8,
          },
          {
            name: "2.0G",
            aliases: [
              "2.0G",
              "Innova G",
            ],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 8,
          },
          {
            name: "2.0V",
            aliases: [
              "2.0V",
              "Innova V",
            ],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },


      {
        name: "Innova Cross",
        category: "MPV",

        versions: [
          {
            name: "Xăng",
            aliases: [
              "Xăng",
              "Innova Cross Xăng",
            ],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "HEV",
            aliases: [
              "HEV",
              "Hybrid",
              "Innova Cross HEV",
            ],
            fuel: "Hybrid",
            gearbox: "e-CVT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },


      {
        name: "Fortuner",
        category: "SUV",

        versions: [
          {
            name: "2.4 AT",
            aliases: [
              "2.4",
              "2.4 AT",
              "Fortuner 2.4",
            ],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 7,
          },
          {
            name: "Legender",
            aliases: [
              "Legender",
              "Fortuner Legender",
            ],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 7,
          },
          {
            name: "2.8 4x4",
            aliases: [
              "2.8",
              "2.8 4x4",
              "Fortuner 2.8",
            ],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x4",
            seats: 7,
          },
        ],
      },


      {
        name: "Hilux",
        category: "Pickup",

        versions: [
          {
            name: "2.4 4x2",
            aliases: [
              "Hilux 2.4",
              "2.4 4x2",
            ],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 5,
          },
          {
            name: "2.8 4x4",
            aliases: [
              "Hilux 2.8",
              "2.8 4x4",
            ],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x4",
            seats: 5,
          },
        ],
      },


      {
        name: "Wigo",
        category: "Hatchback",

        versions: [
          {
            name: "G",
            aliases: [
              "Wigo G",
              "G",
            ],
            fuel: "Xăng",
            gearbox: "AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },

{
  name: "Veloz Cross",
  category: "MPV",

  versions: [
    {
      name: "CVT",
      aliases: [
        "Veloz",
        "Veloz Cross",
        "Veloz Cross CVT",
      ],
      fuel: "Xăng",
      gearbox: "CVT",
      drivetrain: "FWD",
      seats: 7,
    },
    {
      name: "CVT TOP",
      aliases: [
        "Veloz Top",
        "Veloz Cross Top",
        "Veloz Cross CVT TOP",
        "Veloz Cross TOP",
      ],
      fuel: "Xăng",
      gearbox: "CVT",
      drivetrain: "FWD",
      seats: 7,
    },
  ],
},


{
  name: "Avanza Premio",
  category: "MPV",

  versions: [
    {
      name: "MT",
      aliases: [
        "Avanza MT",
        "Avanza Premio MT",
      ],
      fuel: "Xăng",
      gearbox: "Số sàn",
      drivetrain: "FWD",
      seats: 7,
    },
    {
      name: "CVT",
      aliases: [
        "Avanza CVT",
        "Avanza Premio CVT",
      ],
      fuel: "Xăng",
      gearbox: "CVT",
      drivetrain: "FWD",
      seats: 7,
    },
  ],
},


{
  name: "Land Cruiser",
  category: "SUV",

  versions: [
    {
      name: "300",
      aliases: [
        "Land Cruiser",
        "Land Cruiser 300",
        "LC300",
      ],
      fuel: "Xăng",
      gearbox: "10AT",
      drivetrain: "4x4",
      seats: 7,
    },
  ],
},


{
  name: "Land Cruiser Prado",
  category: "SUV",

  versions: [
    {
      name: "Prado",
      aliases: [
        "Prado",
        "Land Cruiser Prado",
        "LC Prado",
      ],
      fuel: "Xăng",
      gearbox: "AT",
      drivetrain: "4x4",
      seats: 7,
    },
  ],
},


{
  name: "Alphard",
  category: "MPV",

  versions: [
    {
      name: "Luxury",
      aliases: [
        "Alphard Luxury",
        "Alphard",
      ],
      fuel: "Xăng",
      gearbox: "CVT",
      drivetrain: "FWD",
      seats: 7,
    },
    {
      name: "HEV",
      aliases: [
        "Alphard HEV",
        "Alphard Hybrid",
        "Alphard Hybrid EV",
      ],
      fuel: "Hybrid",
      gearbox: "e-CVT",
      drivetrain: "FWD",
      seats: 7,
    },
  ],
},

    ],
  },




  // ==================================================
  // HONDA
  // ==================================================

  {
    name: "Honda",

    models: [

      {
        name: "City",
        category: "Sedan",

        versions: [
          {
            name: "G",
            aliases: ["City G", "G"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "L",
            aliases: ["City L", "L"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "RS",
            aliases: ["City RS", "RS"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Civic",
        category: "Sedan",

        versions: [
          {
            name: "E",
            aliases: ["Civic E"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "G",
            aliases: ["Civic G"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "RS",
            aliases: ["Civic RS"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "CR-V",
        category: "SUV",

        versions: [
          {
            name: "G",
            aliases: ["CR-V G"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "L",
            aliases: ["CR-V L"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "L AWD",
            aliases: ["CR-V L AWD"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "AWD",
            seats: 7,
          },
          {
            name: "e:HEV",
            aliases: [
              "HEV",
              "Hybrid",
              "CR-V Hybrid",
              "CR-V e:HEV",
            ],
            fuel: "Hybrid",
            gearbox: "e-CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "HR-V",
        category: "SUV",

        versions: [
          {
            name: "G",
            aliases: ["HR-V G"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "L",
            aliases: ["HR-V L"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "RS",
            aliases: ["HR-V RS"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "BR-V",
        category: "MPV",

        versions: [
          {
            name: "G",
            aliases: ["BR-V G"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "L",
            aliases: ["BR-V L"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },

    ],
  },


  // ==================================================
  // MAZDA
  // ==================================================

  {
    name: "Mazda",

    models: [

      {
        name: "Mazda 2",
        category: "Sedan/Hatchback",

        versions: [
          {
            name: "1.5 AT",
            aliases: [
              "Mazda 2 1.5",
              "Mazda2",
            ],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Mazda 3",
        category: "Sedan/Hatchback",

        versions: [
          {
            name: "1.5 Deluxe",
            aliases: ["Mazda 3 Deluxe"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Luxury",
            aliases: ["Mazda 3 Luxury"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Premium",
            aliases: ["Mazda 3 Premium"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "CX-3",
        category: "SUV",

        versions: [
          {
            name: "1.5 Deluxe",
            aliases: ["CX-3 Deluxe"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Luxury",
            aliases: ["CX-3 Luxury"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "CX-5",
        category: "SUV",

        versions: [
          {
            name: "2.0 Deluxe",
            aliases: ["CX-5 Deluxe"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.0 Luxury",
            aliases: ["CX-5 Luxury"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.0 Premium",
            aliases: ["CX-5 Premium"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.5 Signature",
            aliases: ["CX-5 Signature"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "AWD",
            seats: 5,
          },
        ],
      },


      {
        name: "CX-8",
        category: "SUV",

        versions: [
          {
            name: "2.5 Luxury",
            aliases: ["CX-8 Luxury"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "2.5 Premium",
            aliases: ["CX-8 Premium"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },

    ],
  },


  // ==================================================
  // HYUNDAI
  // ==================================================

  {
    name: "Hyundai",

    models: [

      {
        name: "Accent",
        category: "Sedan",

        versions: [
          {
            name: "1.4 MT",
            aliases: ["Accent MT", "Accent 1.4 MT"],
            fuel: "Xăng",
            gearbox: "Số sàn",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.4 AT",
            aliases: ["Accent AT", "Accent 1.4 AT"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Elantra",
        category: "Sedan",

        versions: [
          {
            name: "1.6 AT",
            aliases: ["Elantra 1.6"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.0 AT",
            aliases: ["Elantra 2.0"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "N Line",
            aliases: ["Elantra N Line"],
            fuel: "Xăng",
            gearbox: "7DCT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Creta",
        category: "SUV",

        versions: [
          {
            name: "1.5 Tiêu chuẩn",
            aliases: [
              "Creta Tiêu chuẩn",
              "Creta Standard",
            ],
            fuel: "Xăng",
            gearbox: "IVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Đặc biệt",
            aliases: [
              "Creta Đặc biệt",
              "Creta Special",
            ],
            fuel: "Xăng",
            gearbox: "IVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Cao cấp",
            aliases: [
              "Creta Cao cấp",
              "Creta Premium",
            ],
            fuel: "Xăng",
            gearbox: "IVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Tucson",
        category: "SUV",

        versions: [
          {
            name: "2.0 Xăng",
            aliases: ["Tucson 2.0 Xăng"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.6 Turbo",
            aliases: [
              "Tucson Turbo",
              "Tucson 1.6 Turbo",
            ],
            fuel: "Xăng",
            gearbox: "7DCT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.0 Diesel",
            aliases: [
              "Tucson Dầu",
              "Tucson Diesel",
            ],
            fuel: "Dầu",
            gearbox: "8AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Santa Fe",
        category: "SUV",

        versions: [
          {
            name: "2.5 Xăng",
            aliases: ["Santa Fe 2.5"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "2.5 Turbo",
            aliases: [
              "Santa Fe Turbo",
              "Santa Fe 2.5 Turbo",
            ],
            fuel: "Xăng",
            gearbox: "8DCT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "2.2 Diesel",
            aliases: [
              "Santa Fe Dầu",
              "Santa Fe Diesel",
            ],
            fuel: "Dầu",
            gearbox: "8DCT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },

    ],
  },


  // ==================================================
  // KIA
  // ==================================================

  {
    name: "Kia",

    models: [

      {
        name: "Morning",
        category: "Hatchback",

        versions: [
          {
            name: "MT",
            aliases: ["Morning MT"],
            fuel: "Xăng",
            gearbox: "Số sàn",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "AT",
            aliases: ["Morning AT"],
            fuel: "Xăng",
            gearbox: "4AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "K3",
        category: "Sedan",

        versions: [
          {
            name: "1.6 Deluxe",
            aliases: ["K3 Deluxe"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.6 Luxury",
            aliases: ["K3 Luxury"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.6 Premium",
            aliases: ["K3 Premium"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Seltos",
        category: "SUV",

        versions: [
          {
            name: "1.4 Turbo",
            aliases: [
              "Seltos Turbo",
              "Seltos 1.4 Turbo",
            ],
            fuel: "Xăng",
            gearbox: "7DCT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.6",
            aliases: ["Seltos 1.6"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Turbo",
            aliases: ["Seltos 1.5 Turbo"],
            fuel: "Xăng",
            gearbox: "7DCT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Sonet",
        category: "SUV",

        versions: [
          {
            name: "1.5 Deluxe",
            aliases: ["Sonet Deluxe"],
            fuel: "Xăng",
            gearbox: "IVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Luxury",
            aliases: ["Sonet Luxury"],
            fuel: "Xăng",
            gearbox: "IVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.5 Premium",
            aliases: ["Sonet Premium"],
            fuel: "Xăng",
            gearbox: "IVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Sportage",
        category: "SUV",

        versions: [
          {
            name: "2.0 Xăng",
            aliases: ["Sportage 2.0"],
            fuel: "Xăng",
            gearbox: "6AT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "1.6 Turbo",
            aliases: ["Sportage Turbo"],
            fuel: "Xăng",
            gearbox: "7DCT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "2.0 Diesel",
            aliases: ["Sportage Diesel"],
            fuel: "Dầu",
            gearbox: "8AT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },

    ],
  },


  // ==================================================
  // MITSUBISHI
  // ==================================================

  {
    name: "Mitsubishi",

    models: [

      {
        name: "Attrage",
        category: "Sedan",

        versions: [
          {
            name: "MT",
            aliases: ["Attrage MT"],
            fuel: "Xăng",
            gearbox: "Số sàn",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "CVT",
            aliases: ["Attrage CVT"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Xpander",
        category: "MPV",

        versions: [
          {
            name: "MT",
            aliases: ["Xpander MT"],
            fuel: "Xăng",
            gearbox: "Số sàn",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "AT",
            aliases: ["Xpander AT"],
            fuel: "Xăng",
            gearbox: "4AT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "Premium",
            aliases: ["Xpander Premium"],
            fuel: "Xăng",
            gearbox: "4AT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },


      {
        name: "Outlander",
        category: "SUV",

        versions: [
          {
            name: "2.0 CVT",
            aliases: ["Outlander 2.0"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "2.4 CVT",
            aliases: ["Outlander 2.4"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "AWD",
            seats: 7,
          },
        ],
      },


      {
        name: "Triton",
        category: "Pickup",

        versions: [
          {
            name: "4x2",
            aliases: ["Triton 4x2"],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 5,
          },
          {
            name: "4x4",
            aliases: ["Triton 4x4"],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x4",
            seats: 5,
          },
        ],
      },

    ],
  },


  // ==================================================
  // FORD
  // ==================================================

  {
    name: "Ford",

    models: [

      {
        name: "Ranger",
        category: "Pickup",

        versions: [
          {
            name: "XL",
            aliases: ["Ranger XL"],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 5,
          },
          {
            name: "XLS",
            aliases: ["Ranger XLS"],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 5,
          },
          {
            name: "Wildtrak",
            aliases: ["Ranger Wildtrak"],
            fuel: "Dầu",
            gearbox: "10AT",
            drivetrain: "4x4",
            seats: 5,
          },
          {
            name: "Raptor",
            aliases: ["Ranger Raptor"],
            fuel: "Xăng/Dầu",
            gearbox: "10AT",
            drivetrain: "4x4",
            seats: 5,
          },
        ],
      },


      {
        name: "Everest",
        category: "SUV",

        versions: [
          {
            name: "Ambiente",
            aliases: ["Everest Ambiente"],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 7,
          },
          {
            name: "Sport",
            aliases: ["Everest Sport"],
            fuel: "Dầu",
            gearbox: "6AT",
            drivetrain: "4x2",
            seats: 7,
          },
          {
            name: "Titanium",
            aliases: ["Everest Titanium"],
            fuel: "Dầu",
            gearbox: "10AT",
            drivetrain: "4x2",
            seats: 7,
          },
          {
            name: "Titanium+",
            aliases: ["Everest Titanium Plus"],
            fuel: "Dầu",
            gearbox: "10AT",
            drivetrain: "4x4",
            seats: 7,
          },
        ],
      },


      {
        name: "Territory",
        category: "SUV",

        versions: [
          {
            name: "Trend",
            aliases: ["Territory Trend"],
            fuel: "Xăng",
            gearbox: "7DCT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "Titanium",
            aliases: ["Territory Titanium"],
            fuel: "Xăng",
            gearbox: "7DCT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },

    ],
  },


  // ==================================================
  // VINFAST
  // ==================================================

  {
    name: "VinFast",

    models: [

      {
        name: "Fadil",
        category: "Hatchback",

        versions: [
          {
            name: "Base",
            aliases: ["Fadil Base", "Fadil Tiêu chuẩn"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
          {
            name: "Plus",
            aliases: ["Fadil Plus", "Fadil Nâng cao"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Lux A2.0",
        category: "Sedan",

        versions: [
          {
            name: "Tiêu chuẩn",
            aliases: [
              "Lux A",
              "Lux A2.0",
              "Lux A tiêu chuẩn",
            ],
            fuel: "Xăng",
            gearbox: "8AT",
            drivetrain: "RWD",
            seats: 5,
          },
          {
            name: "Cao cấp",
            aliases: [
              "Lux A Premium",
              "Lux A cao cấp",
            ],
            fuel: "Xăng",
            gearbox: "8AT",
            drivetrain: "RWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Lux SA2.0",
        category: "SUV",

        versions: [
          {
            name: "Tiêu chuẩn",
            aliases: [
              "Lux SA",
              "Lux SA tiêu chuẩn",
            ],
            fuel: "Xăng",
            gearbox: "8AT",
            drivetrain: "RWD",
            seats: 7,
          },
          {
            name: "Cao cấp",
            aliases: [
              "Lux SA Premium",
              "Lux SA cao cấp",
            ],
            fuel: "Xăng",
            gearbox: "8AT",
            drivetrain: "RWD",
            seats: 7,
          },
        ],
      },


      {
        name: "VF e34",
        category: "SUV",

        versions: [
          {
            name: "Base",
            aliases: [
              "VF34",
              "VF e34",
              "e34",
            ],
            fuel: "Điện",
            gearbox: "1 cấp",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "VF 5",
        category: "SUV",

        versions: [
          {
            name: "Plus",
            aliases: [
              "VF5",
              "VF 5 Plus",
            ],
            fuel: "Điện",
            gearbox: "1 cấp",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "VF 8",
        category: "SUV",

        versions: [
          {
            name: "Eco",
            aliases: ["VF8 Eco"],
            fuel: "Điện",
            gearbox: "1 cấp",
            drivetrain: "AWD",
            seats: 5,
          },
          {
            name: "Plus",
            aliases: ["VF8 Plus"],
            fuel: "Điện",
            gearbox: "1 cấp",
            drivetrain: "AWD",
            seats: 5,
          },
        ],
      },


      {
        name: "VF 9",
        category: "SUV",

        versions: [
          {
            name: "Eco",
            aliases: ["VF9 Eco"],
            fuel: "Điện",
            gearbox: "1 cấp",
            drivetrain: "AWD",
            seats: 7,
          },
          {
            name: "Plus",
            aliases: ["VF9 Plus"],
            fuel: "Điện",
            gearbox: "1 cấp",
            drivetrain: "AWD",
            seats: 7,
          },
        ],
      },

    ],
  },


  // ==================================================
  // SUZUKI
  // ==================================================

  {
    name: "Suzuki",

    models: [

      {
        name: "Swift",
        category: "Hatchback",

        versions: [
          {
            name: "GLX",
            aliases: ["Swift GLX"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Ertiga",
        category: "MPV",

        versions: [
          {
            name: "MT",
            aliases: ["Ertiga MT"],
            fuel: "Xăng",
            gearbox: "Số sàn",
            drivetrain: "FWD",
            seats: 7,
          },
          {
            name: "AT",
            aliases: ["Ertiga AT"],
            fuel: "Xăng",
            gearbox: "4AT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },


      {
        name: "XL7",
        category: "MPV",

        versions: [
          {
            name: "AT",
            aliases: ["XL7 AT", "Suzuki XL7"],
            fuel: "Xăng",
            gearbox: "4AT",
            drivetrain: "FWD",
            seats: 7,
          },
        ],
      },

    ],
  },


  // ==================================================
  // NISSAN
  // ==================================================

  {
    name: "Nissan",

    models: [

      {
        name: "Almera",
        category: "Sedan",

        versions: [
          {
            name: "CVT",
            aliases: ["Almera CVT"],
            fuel: "Xăng",
            gearbox: "CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Kicks",
        category: "SUV",

        versions: [
          {
            name: "e-POWER",
            aliases: [
              "Kicks ePOWER",
              "Kicks e-POWER",
            ],
            fuel: "Hybrid",
            gearbox: "e-CVT",
            drivetrain: "FWD",
            seats: 5,
          },
        ],
      },


      {
        name: "Navara",
        category: "Pickup",

        versions: [
          {
            name: "4x2",
            aliases: ["Navara 4x2"],
            fuel: "Dầu",
            gearbox: "7AT",
            drivetrain: "4x2",
            seats: 5,
          },
          {
            name: "4x4",
            aliases: ["Navara 4x4"],
            fuel: "Dầu",
            gearbox: "7AT",
            drivetrain: "4x4",
            seats: 5,
          },
        ],
      },

    ],
  },

];


// ==================================================
// HELPER
// ==================================================

export function getBrandByName(name) {

  return brands.find(
    (brand) => brand.name === name
  );

}


export function getModel(
  brandName,
  modelName
) {

  const brand =
    getBrandByName(brandName);

  if (!brand) {
    return null;
  }

  return brand.models.find(
    (model) => model.name === modelName
  ) || null;

}


export function getVersions(
  brandName,
  modelName
) {

  const model =
    getModel(
      brandName,
      modelName
    );

  return model?.versions || [];

}