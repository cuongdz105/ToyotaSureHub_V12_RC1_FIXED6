export const CUSTOMER_STATUS = {
  NEW: "new",
  CONTACTED: "contacted",
  APPOINTMENT: "appointment",
  NEGOTIATING: "negotiating",
  DEPOSIT: "deposit",
  SOLD: "sold",
  LOST: "lost",
};

export const CUSTOMER_SOURCE = {
  FACEBOOK: "facebook",
  FACEBOOK_GROUP: "facebook_group",
  MESSENGER: "messenger",
  WEBSITE: "website",
  TIKTOK: "tiktok",
  ZALO: "zalo",
  WALKIN: "walkin",
  OTHER: "other",
};

export const createCustomer = () => ({
  id: crypto.randomUUID(),

  name: "",
  phone: "",
  facebook: "",
  zalo: "",

  interestedCars: [],

  status: CUSTOMER_STATUS.NEW,
  source: CUSTOMER_SOURCE.FACEBOOK_GROUP,

  note: "",

  createdAt: new Date().toISOString(),
  lastContact: "",
  nextReminder: "",
});