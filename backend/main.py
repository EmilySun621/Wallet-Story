from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from browser_use import Agent, ChatBrowserUse
from dotenv import load_dotenv
from agents import orchestrator, identity_agent, news_agent, defi_agent
from uagents import Bureau
from agents import identity_agent_task, news_agent_task, defi_agent_task
import threading
import asyncio
import os

load_dotenv()

app = FastAPI()

app.add_middleware(...)

def run_bureau():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    bureau = Bureau()
    bureau.add(orchestrator)
    bureau.add(identity_agent)
    bureau.add(news_agent)
    bureau.add(defi_agent)
    bureau.run()


threading.Thread(target=run_bureau, daemon=True).start()

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class WalletRequest(BaseModel):
    address: str

@app.post("/api/wallet-context")
async def get_wallet_context(req: WalletRequest):
    llm = ChatBrowserUse(model="bu-latest")
    
    agent = Agent(
        task=f"""Search for information about Ethereum wallet address {req.address}.
        Find:
        1. Who owns this wallet (if publicly known)
        2. Recent news or tweets related to this address or its owner
        3. Any notable on-chain events mentioned in crypto news
        
        Return a brief summary of what you found.""",
        llm=llm,
    )
    
    result = await agent.run()
    return { "context": result }


@app.post("/api/wallet-agents")
async def run_wallet_agents(req: WalletRequest):
    results = await asyncio.gather(
        identity_agent_task(req.address),
        news_agent_task(req.address),
        defi_agent_task(req.address),
    )
    
    return {
        "identity": str(results[0]),
        "news": str(results[1]),
        "defi": str(results[2])
    }