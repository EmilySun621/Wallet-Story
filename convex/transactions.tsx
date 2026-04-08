import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// get transcation in the backend 
export const getTransactions = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .filter(q => q.eq(q.field("address"), args.address))
      .collect();
  },
});

export const getAnalysis = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analysis")
      .filter(q => q.eq(q.field("address"), args.address))
      .first();
  },
});

// save transcation records
export const saveTransactions = mutation({
  args: {
    address: v.string(),
    chartData: v.array(v.object({
      date: v.string(),
      txCount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // delete existing data 
    const existing = await ctx.db
      .query("transactions")
      .filter(q => q.eq(q.field("address"), args.address))
      .collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    // save new data 
    for (const item of args.chartData) {
      await ctx.db.insert("transactions", {
        address: args.address,
        date: item.date,
        txCount: item.txCount,
        updatedAt: Date.now(),
      });
    }
  },
});

// save wallet AI analysis results 
export const saveAnalysis = mutation({
  args: {
    address: v.string(),
    type: v.string(),
    riskLevel: v.string(),
    summary: v.string(),
    chartType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("analysis")
      .filter(q => q.eq(q.field("address"), args.address))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("analysis", { ...args, updatedAt: Date.now() });
    }
  },
});

export const saveRawTransactions = mutation({
  args: {
    address: v.string(),
    transactions: v.array(v.object({
      from_address: v.string(),
      to_address: v.string(),
      value: v.string(),
      block_timestamp: v.string(),
      gas_price: v.string(),
      receipt_status: v.string(),
      hash: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // delete old data
    const existing = await ctx.db
      .query("rawTransactions")
      .filter(q => q.eq(q.field("address"), args.address))
      .collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    // store new data
    for (const tx of args.transactions) {
      await ctx.db.insert("rawTransactions", {
        address: args.address,
        ...tx,
      });
    }
  },
});

export const getRawTransactions = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rawTransactions")
      .filter(q => q.eq(q.field("address"), args.address))
      .collect();
  },
});

// query searching
export const queryByDate = query({
  args: { address: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const txs = await ctx.db
      .query("rawTransactions")
      .filter(q => q.eq(q.field("address"), args.address))
      .collect()
    
    const byDate: Record<string, number> = {}
    txs.forEach(tx => {
      const date = tx.block_timestamp.slice(0, 10)
      byDate[date] = (byDate[date] || 0) + 1
    })
    
    return Object.entries(byDate)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, args.limit)
  },
});

export const queryByAddress = query({
  args: { address: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const txs = await ctx.db
      .query("rawTransactions")
      .filter(q => q.eq(q.field("address"), args.address))
      .collect()
    
    const byAddress: Record<string, number> = {}
    txs.forEach(tx => {
      const other = tx.from_address === args.address.toLowerCase()
        ? tx.to_address
        : tx.from_address
      if (other) byAddress[other] = (byAddress[other] || 0) + 1
    })
    
    return Object.entries(byAddress)
      .map(([label, value]) => ({ label: label.slice(0, 10) + '...', value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, args.limit)
  },
});