// Cài đặt mặc định — dùng chung cho nền và popup
export const DEFAULT_SETTINGS = {
  supabaseUrl: "https://vetuvraxaiycgjetelyg.supabase.co",
  supabaseKey: "",
  accountId: "",
  accountName: "",
  enabled: false,          // công tắc tổng
  activeFrom: 8,
  activeTo: 21,
  closeWindowOnSuccess: true,

  // 🧱 Tường cá nhân
  wallEnabled: true,
  dailyLimit: 3,
  gapMinMinutes: 60,
  gapMaxMinutes: 120,

  // 👥 Nhóm (1 lần đăng = nhóm chính + chia sẻ thêm N nhóm)
  groupEnabled: false,
  groupDailyLimit: 3,
  groupExtraCount: 10,
  groupGapMinMinutes: 40,
  groupGapMaxMinutes: 70,
  groupFallbackKeywords: "toyota",
};
