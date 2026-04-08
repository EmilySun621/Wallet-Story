const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_KEY;
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const MORALIS_KEY = import.meta.env.VITE_MORALIS_KEY;

export async function getTransactions(address) {
  const response = await fetch(
    `https://deep-index.moralis.io/api/v2.2/${address}?chain=eth&limit=50`,
    {
      headers: {
        "X-API-Key": MORALIS_KEY,
      },
    },
  );
  const data = await response.json();
  return data.result;
}

export async function getTokenBalances(address) {
  const response = await fetch(
    `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=eth`,
    {
      headers: {
        "X-API-Key": MORALIS_KEY,
      },
    },
  );
  const data = await response.json();
  return data.result;
}

export async function getNetWorth(address) {
  const response = await fetch(
    `https://deep-index.moralis.io/api/v2.2/wallets/${address}/net-worth?chains=eth`,
    {
      headers: {
        "X-API-Key": MORALIS_KEY,
      },
    },
  );
  const data = await response.json();
  return data;
}

export async function analyzeWallet(transcations) {
  const summary = transcations.slice(0, 20).map((tx) => ({
    value: tx.value,
    from: tx.from_address,
    to: tx.to_address,
    timeStamp: tx.block_timeStamp,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze the last 20 transactions of this Ethereum wallet and provide:
            1. User type (retail/whale/arbitrageur/DeFi player)
            2. Risk level (low/medium/high)
            3. Two sentence behavioral summary

            Transaction data: ${JSON.stringify(summary)}
            Also decide the best chart type for this wallet's data.
            Return chartType as one of: "line", "bar", "pie"
            Reply in JSON format: {"type":"","riskLevel":"","summary":"" ,"chartType":""}
            `,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const clean = jsonMatch ? jsonMatch[0] : text;
  return JSON.parse(clean);
}

// Explanatory Prompt
export async function exploreWallet(question) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are helping analyze Ethereum wallet data.

User question: "${question}"

Available query types:
- "groupByDate": groups transactions by date, shows activity over time
- "groupByAddress": shows which addresses interact most with this wallet

Based on the question, return JSON:
{
  "queryType": "groupByDate" or "groupByAddress",
  "limit": 5,
  "chartType": "bar" or "line",
  "title": "short chart title"
}

Reply in JSON only.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

export async function generateInsights(transactions) {
  const sample = transactions.slice(0, 50).map((tx) => ({
    from: tx.from_address,
    to: tx.to_address,
    value: tx.value,
    timestamp: tx.block_timestamp,
    gas: tx.gas_price,
    status: tx.receipt_status,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze this Ethereum wallet's transactions and find 3 interesting insights the user didn't ask for.

Look for:
- Unusual patterns (sudden spike in activity, repeated transactions)
- Suspicious behavior (interactions with known risky patterns)
- Interesting facts (most active time, dominant transaction type)

Transaction data: ${JSON.stringify(sample)}

Return JSON:
{
  "insights": [
    { "emoji": "🔴", "title": "short title", "description": "one sentence explanation" },
    { "emoji": "🟡", "title": "short title", "description": "one sentence explanation" },
    { "emoji": "🟢", "title": "short title", "description": "one sentence explanation" }
  ]
}

Reply in JSON only.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

export async function getWalletContext(address) {
  const response = await fetch("http://localhost:8003/api/wallet-context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  const data = await response.json();
  return data.context;
}

export async function analyzeWithContext(transactions, context) {
  const sample = transactions.slice(0, 20).map((tx) => ({
    from: tx.from_address,
    to: tx.to_address,
    value: tx.value,
    timestamp: tx.block_timestamp,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are analyzing an Ethereum wallet combining on-chain data and off-chain context.

    On-chain transactions: ${JSON.stringify(sample)}

    Off-chain context (from web research): ${context}

    Find 2-3 insights that combine BOTH on-chain and off-chain information.
    For example: "On-chain shows large ETH outflow in February, which matches news of Vitalik selling 8800 ETH via Binance"

    Return JSON:
    {
    "insights": [
        { "emoji": "🔗", "title": "short title", "description": "one sentence combining on-chain + off-chain" }
    ]
    }

    Reply in JSON only.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}


export async function getWalletAgents(address) {
  const response = await fetch('http://localhost:8003/api/wallet-agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  })
  const data = await response.json()
  return data
}