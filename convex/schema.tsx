import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transactions: defineTable({
    address: v.string(),
    date: v.string(),
    txCount: v.number(),
    updatedAt: v.number(),
  }),
  analysis: defineTable({
    address: v.string(),
    type: v.string(),
    riskLevel: v.string(),
    summary: v.string(),
    chartType: v.string(),
    updatedAt: v.number(),
  }),
  rawTransactions: defineTable({
    address: v.string(),
    from_address: v.string(),
    to_address: v.string(),
    value: v.string(),
    block_timestamp: v.string(),
    gas_price: v.string(),
    receipt_status: v.string(),
    hash: v.string(),
  }),
});