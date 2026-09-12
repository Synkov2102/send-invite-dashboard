/**
 * Read-only shapes mirroring the collections written by the main
 * send-invite.online backend. Only the fields the dashboard reads are listed.
 */

export type PaymentOrderStatus = "pending" | "paid" | "cancelled";

export type PaymentOrderDocument = {
  _id: string;
  amount: string;
  createdAt: string;
  discountAmount: string;
  email: string | null;
  invId: number;
  originalAmount: string;
  ownerId: string;
  paidAt: string | null;
  paymentMethod: string | null;
  promoCode: string | null;
  promoCodeId: string | null;
  promoRedeemedAt: string | null;
  siteId: string;
  status: PaymentOrderStatus;
  updatedAt: string;
};

export type SiteDocument = {
  _id: string;
  createdAt: string;
  invite: {
    bride: string;
    city: string;
    date: string;
    groom: string;
    time: string;
    venue: string;
  };
  isPaid?: boolean;
  isPublished?: boolean;
  ownerId?: string;
  templateId: string;
  updatedAt: string;
};

export type PromoCodeDocument = {
  _id: string;
  code: string;
  isActive: boolean;
  maxUses: number | null;
  type: "percent" | "fixed";
  usedCount: number;
  value: number;
};

export type UserDocument = {
  _id: string;
  avatarUrl: string | null;
  createdAt: string;
  email: string | null;
  login: string;
  name: string;
};
