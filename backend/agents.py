from uagents import Agent, Context, Model, Bureau
from browser_use import Agent as BrowserAgent, ChatBrowserUse
import asyncio

# 定义消息格式
class WalletRequest(Model):
    address: str

class AgentResult(Model):
    agent_name: str
    result: str

class FinalReport(Model):
    identity: str
    news: str
    defi: str


orchestrator = Agent(name="orchestrator", seed="orchestrator_seed_123")
identity_agent = Agent(name="identity_agent", seed="identity_seed_123")
news_agent = Agent(name="news_agent", seed="news_seed_123")
defi_agent = Agent(name="defi_agent", seed="defi_seed_123")


results = {}

# A demonstration of fetch.ai framework!
# Orchestrator receive frontend request and sent it to agents
@orchestrator.on_message(model=WalletRequest)
async def handle_wallet_request(ctx: Context, sender: str, msg: WalletRequest):
    ctx.logger.info(f"Orchestrator Receive Request: {msg.address}")
    # 同时发给三个 agent
    await asyncio.gather(
        ctx.send(identity_agent.address, msg),
        ctx.send(news_agent.address, msg),
        ctx.send(defi_agent.address, msg),
    )

# Identity Agent
@identity_agent.on_message(model=WalletRequest)
async def handle_identity(ctx: Context, sender: str, msg: WalletRequest):
    ctx.logger.info(f"Identity Agent Start Searching: {msg.address}")
    llm = ChatBrowserUse(model="bu-latest")
    agent = BrowserAgent(
        task=f"Search Etherscan and ENS for wallet {msg.address}. Find owner identity, ENS name, any labels.",
        llm=llm,
        use_vision=False,
        headless=True,
    )
    result = await agent.run()
    await ctx.send(orchestrator.address, AgentResult(
        agent_name="identity",
        result=str(result)
    ))

# News Agent
@news_agent.on_message(model=WalletRequest)
async def handle_news(ctx: Context, sender: str, msg: WalletRequest):
    ctx.logger.info(f"News Agent Start Searching: {msg.address}")
    llm = ChatBrowserUse(model="bu-latest")
    agent = BrowserAgent(
        task=f"Search Google News and CoinDesk for recent news about wallet {msg.address} or its owner in the last 30 days.",
        llm=llm,
        use_vision=False,
        headless=True,
    )
    result = await agent.run()
    await ctx.send(orchestrator.address, AgentResult(
        agent_name="news",
        result=str(result)
    ))

# DeFi Agent
@defi_agent.on_message(model=WalletRequest)
async def handle_defi(ctx: Context, sender: str, msg: WalletRequest):
    ctx.logger.info(f"DeFi Agent Start Searching: {msg.address}")
    llm = ChatBrowserUse(model="bu-latest")
    agent = BrowserAgent(
        task=f"Search DefiLlama and Zapper for DeFi positions of wallet {msg.address}. Find protocols and amounts.",
        llm=llm,
        use_vision=False,
        headless=True,
    )
    result = await agent.run()
    await ctx.send(orchestrator.address, AgentResult(
        agent_name="defi",
        result=str(result)
    ))

# Orchestrator get results from three agents
@orchestrator.on_message(model=AgentResult)
async def collect_results(ctx: Context, sender: str, msg: AgentResult):
    results[msg.agent_name] = msg.result
    ctx.logger.info(f"Receive {msg.agent_name} 's Result")
    
    if len(results) == 3:
        ctx.logger.info("All Agents Down. Generate Final Reports.")
        ctx.logger.info(f"Identity: {results.get('identity', '')[:100]}")
        ctx.logger.info(f"News: {results.get('news', '')[:100]}")
        ctx.logger.info(f"DeFi: {results.get('defi', '')[:100]}")
        
       
       

# The Actual function the fastAPI use to call
async def identity_agent_task(address: str) -> str:
    llm = ChatBrowserUse(model="bu-latest")
    agent = BrowserAgent(
        task=f"Search Etherscan and ENS for wallet {address}. Find owner identity, ENS name, any labels.",
        llm=llm,
        use_vision=False,
        headless=True,
    )
    return await agent.run()

async def news_agent_task(address: str) -> str:
    llm = ChatBrowserUse(model="bu-latest")
    agent = BrowserAgent(
        task=f"Search Google News and CoinDesk for recent news about wallet {address} or its owner in the last 30 days.",
        llm=llm,
        use_vision=False,
        headless=True,
    )
    return await agent.run()

async def defi_agent_task(address: str) -> str:
    llm = ChatBrowserUse(model="bu-latest")
    agent = BrowserAgent(
        task=f"Search DefiLlama and Zapper for DeFi positions of wallet {address}.",
        llm=llm,
        use_vision=False,
        headless=True,
    )
    return await agent.run()