import { getCars } from "./carService";
import { loadPostingQueue } from "./facebookPostingQueueService";
import { loadCampaigns } from "./facebookCampaignService";
import { loadAccounts } from "./facebookAccountService";
import { loadGroups } from "./facebookGroupService";


const DEFAULT_TARGET_POSTS = 20;


/*
========================================
ĐỘ HOT CƠ BẢN CỦA DÒNG XE
========================================

Đây chỉ là baseline ban đầu.

Sau này mình sẽ thay bằng dữ liệu
thực tế của ToyotaSureHub:
- lượt tương tác
- inbox
- khách quan tâm
- tốc độ bán
*/
const MODEL_HEAT = {

  "corolla cross": 20,

  "vios": 18,

  "fortuner": 18,

  "yaris cross": 17,

  "raize": 16,

  "veloz": 16,

  "avanza": 15,

  "camry": 15,

  "altis": 14,

  "innova": 14,

  "prado": 13,

  "hilux": 13,

  "wigo": 12,

};


function normalize(value) {

  return String(value || "")
    .trim()
    .toLowerCase();

}


function daysSince(value) {

  if (!value) {
    return null;
  }

  const time =
    new Date(value).getTime();

  if (Number.isNaN(time)) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - time) /
      86400000
    )
  );

}


function getCarLabel(car) {

  return [
    car?.brand,
    car?.model,
    car?.version,
    car?.year,
    car?.color,
  ]
    .filter(Boolean)
    .join(" ");

}


function getModelHeat(car) {

  const model =
    normalize(car?.model);

  for (
    const [key, score]
    of Object.entries(MODEL_HEAT)
  ) {

    if (
      model.includes(key)
    ) {

      return score;

    }

  }

  return 10;

}


function getQueueJobsForCar(
  carId,
  queue
) {

  return queue.filter(
    (job) =>
      String(job.carId) ===
      String(carId)
  );

}


function getCampaignsForCar(
  carId,
  campaigns
) {

  return campaigns.filter(
    (campaign) =>
      String(campaign.carId) ===
      String(carId)
  );

}


function getLastPostingDate(
  queue,
  campaigns
) {

  const dates = [];


  queue.forEach(
    (job) => {

      if (
        job.status ===
        "success"
      ) {

        if (
          job.result?.completedAt
        ) {

          dates.push(
            job.result.completedAt
          );

        }

        if (
          job.updatedAt
        ) {

          dates.push(
            job.updatedAt
          );

        }

      }

    }
  );


  campaigns.forEach(
    (campaign) => {

      if (
        campaign.status ===
        "completed"
      ) {

        if (
          campaign.completedAt
        ) {

          dates.push(
            campaign.completedAt
          );

        }

        if (
          campaign.updatedAt
        ) {

          dates.push(
            campaign.updatedAt
          );

        }

      }

    }
  );


  const times =
    dates
      .map(
        (date) =>
          new Date(date).getTime()
      )
      .filter(
        (time) =>
          !Number.isNaN(time)
      );


  if (
    times.length === 0
  ) {

    return null;

  }


  return new Date(
    Math.max(...times)
  ).toISOString();

}


function chooseBestAccount(
  car,
  accounts,
  groups
) {

  const activeAccounts =
    accounts.filter(
      (account) =>
        account?.status ===
        "active"
    );


  if (
    activeAccounts.length === 0
  ) {

    return null;

  }


  const model =
    normalize(car?.model);


  const ranked =
    activeAccounts.map(
      (account) => {

        const eligibleGroups =
          groups.filter(
            (group) => {

              if (
                group?.status &&
                group.status !==
                  "active"
              ) {

                return false;

              }


              if (
                group?.allowPost ===
                false
              ) {

                return false;

              }


              const groupId =
                String(group?.id);


              if (
                account.allowAllGroups !==
                false
              ) {

                const excluded =
                  Array.isArray(
                    account.excludedGroupIds
                  )
                    ? account.excludedGroupIds
                    : [];


                return !excluded.some(
                  (id) =>
                    String(id) ===
                    groupId
                );

              }


              const allowed =
                Array.isArray(
                  account.allowedGroupIds
                )
                  ? account.allowedGroupIds
                  : [];


              return allowed.some(
                (id) =>
                  String(id) ===
                  groupId
              );

            }
          );


        let score =
          eligibleGroups.length;


        const modelGroups =
          eligibleGroups.filter(
            (group) => {

              const suitable =
                Array.isArray(
                  group?.suitableCars
                )
                  ? group.suitableCars
                  : [];


              return suitable.some(
                (item) =>
                  normalize(item)
                    .includes(model)
              );

            }
          );


        score +=
          modelGroups.length * 3;


        return {

          account,

          score,

          eligibleGroupCount:
            eligibleGroups.length,

        };

      }
    );


  ranked.sort(
    (a, b) =>
      b.score - a.score
  );


  return (
    ranked[0]?.account ||
    activeAccounts[0]
  );

}


function buildReasons({
  car,
  score,
  daysSinceLastPosting,
  ageInStock,
}) {

  const reasons = [];


  if (
    daysSinceLastPosting ===
    null
  ) {

    reasons.push(
      "Chưa có lịch sử đăng"
    );

  }
  else if (
    daysSinceLastPosting >=
    14
  ) {

    reasons.push(
      `${daysSinceLastPosting} ngày chưa đăng lại`
    );

  }
  else if (
    daysSinceLastPosting >=
    7
  ) {

    reasons.push(
      `${daysSinceLastPosting} ngày chưa đăng lại`
    );

  }
  else if (
    daysSinceLastPosting >=
    3
  ) {

    reasons.push(
      `${daysSinceLastPosting} ngày chưa đăng lại`
    );

  }


  if (
    ageInStock >=
    60
  ) {

    reasons.push(
      `Tồn kho ${ageInStock} ngày`
    );

  }
  else if (
    ageInStock >=
    30
  ) {

    reasons.push(
      `Tồn kho ${ageInStock} ngày`
    );

  }
  else if (
    ageInStock >=
    14
  ) {

    reasons.push(
      `Tồn kho ${ageInStock} ngày`
    );

  }


  if (
    getModelHeat(car) >=
    18
  ) {

    reasons.push(
      "Dòng xe có độ ưu tiên thị trường cao"
    );

  }


  if (
    score >= 80
  ) {

    reasons.push(
      "Ưu tiên cao"
    );

  }


  return reasons.slice(
    0,
    4
  );

}


export function calculateCarPriority({

  car,

  queue,

  campaigns,

  accounts,

  groups,

}) {

  if (
    !car ||
    car.status ===
      "🔴 Đã bán"
  ) {

    return null;

  }


  const carQueue =
    getQueueJobsForCar(
      car.id,
      queue
    );


  const carCampaigns =
    getCampaignsForCar(
      car.id,
      campaigns
    );


  /*
  ========================================
  VIỆC ĐANG DỞ
  ========================================
  */

  const hasOpenQueue =
  carQueue.some(
    (job) =>
      job.status !== "success"
  );

  const carLabel =
    getCarLabel(car);


  /*
  Nếu có Queue/Campaign đang dở
  thì ưu tiên tuyệt đối.
  */

  if (hasOpenQueue) {

    const total =
      carQueue.length ||
      carCampaigns[0]?.totalJobs ||
      DEFAULT_TARGET_POSTS;


    const completed =
      carQueue.filter(
        (job) =>
          job.status ===
          "success"
      ).length;


    return {

      type: "queue",

      carId:
        car.id,

      carLabel,

      score: 100,

      label:
        "Tiếp tục xử lý",

      targetPosts:
        total,

      completedPosts:
        completed,

      remainingPosts:
        Math.max(
          0,
          total - completed
        ),

      accountId:
        carQueue.find(
          (job) =>
            job.status !==
            "success"
        )?.accountId ??
        carCampaigns[0]?.accountId ??
        null,

      accountName:
        null,

      reasons: [

        "Có công việc Facebook đang làm dở",

        `${completed}/${total} bài đã hoàn thành`,

      ],

      nextAction: {

        label:
          "📋 Vào Queue",

        route:
          "/facebook/queue",

      },

    };

  }


  /*
  ========================================
  VIỆC MỚI
  ========================================
  */

  const lastPostingAt =
    getLastPostingDate(
      carQueue,
      carCampaigns
    );


  const daysSinceLastPosting =
    daysSince(
      lastPostingAt
    );


  /*
  Tạm thời nếu xe chưa có createdAt
  thì không đoán tuổi kho.
  */

  const createdAt =
    car.createdAt ||
    car.importedAt ||
    null;


  const ageInStock =
    daysSince(
      createdAt
    );


  let score = 0;


  /*
  Chưa từng đăng
  */

  if (
    daysSinceLastPosting ===
    null
  ) {

    score += 35;

  }
  else if (
    daysSinceLastPosting >=
    14
  ) {

    score += 30;

  }
  else if (
    daysSinceLastPosting >=
    7
  ) {

    score += 22;

  }
  else if (
    daysSinceLastPosting >=
    3
  ) {

    score += 12;

  }


  /*
  Xe mới nhập
  */

  if (
    ageInStock !==
    null
  ) {

    if (
      ageInStock <=
      2
    ) {

      score += 20;

    }
    else if (
      ageInStock <=
      7
    ) {

      score += 12;

    }


    /*
    Xe tồn kho lâu
    */

    if (
      ageInStock >=
      60
    ) {

      score += 25;

    }
    else if (
      ageInStock >=
      30
    ) {

      score += 18;

    }
    else if (
      ageInStock >=
      14
    ) {

      score += 10;

    }

  }


  /*
  Độ hot
  */

  score +=
    getModelHeat(car);


  /*
  Chưa có content FB
  */

  if (
    !car.aiContent?.facebook?.trim()
  ) {

    score += 5;

  }


  score =
    Math.min(
      99,
      Math.round(score)
    );


  const account =
    chooseBestAccount(
      car,
      accounts,
      groups
    );


  return {

    type:
      "new_posting",

    carId:
      car.id,

    carLabel,

    score,

    label:
      "Bắt đầu đăng",

    targetPosts:
      DEFAULT_TARGET_POSTS,

    completedPosts:
      0,

    remainingPosts:
      DEFAULT_TARGET_POSTS,

    accountId:
      account?.id ??
      null,

    accountName:
      account?.name ??
      "Chưa có Facebook phù hợp",

    daysSinceLastPosting,

    ageInStock,

    reasons:
      buildReasons({

        car,

        score,

        daysSinceLastPosting,

        ageInStock,

      }),

    nextAction: {

      label:
        "🚀 Bắt đầu đăng",

      route:
        "/facebook/post",

    },

  };

}


export function getPriorityTasks() {

  /*
  QUAN TRỌNG:
  Project hiện tại dùng getCars(),
  không dùng getActiveCars().
  */

  const cars =
    getCars();


  const queue =
    loadPostingQueue();


  const campaigns =
    loadCampaigns();


  const accounts =
    loadAccounts();


  const groups =
    loadGroups();


  return cars

    .map(
      (car) =>
        calculateCarPriority({

          car,

          queue,

          campaigns,

          accounts,

          groups,

        })
    )

    .filter(Boolean)

    .sort(
      (a, b) =>
        b.score - a.score
    );

}