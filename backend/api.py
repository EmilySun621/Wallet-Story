"""
api.py — FastAPI backend for WalletStory forensic investigations.

Endpoints:
  - POST /investigate { address } → runs InvestigatorAgent, returns ForensicReport
  - GET /case/theo → returns precomputed Theo case study output
  - GET /health → health check
"""

import json
import logging
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from investigator_agent import InvestigatorAgent

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")
log = logging.getLogger("api")

# Initialize FastAPI app
app = FastAPI(
    title="WalletStory API",
    description="Autonomous blockchain forensics for prediction market insider trading detection",
    version="1.0.0",
)

# CORS middleware — allow frontend (localhost:5173 in dev, deployed domain in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",  # Vercel preview/prod deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request/Response Models ---


class InvestigateRequest(BaseModel):
    """Request body for /investigate endpoint."""

    address: str = Field(
        ...,
        description="Ethereum wallet address to investigate (0x...)",
        pattern=r"^0x[a-fA-F0-9]{40}$",
    )
    max_iterations: int = Field(
        15,
        description="Maximum agent iterations (default: 15)",
        ge=1,
        le=30,
    )


class InvestigateResponse(BaseModel):
    """Response for /investigate endpoint."""

    case_name: str
    generated_at: str
    seed_address: str
    wallets_analyzed: int
    total_cluster_size: int
    insider_detection: dict[str, Any]
    per_wallet: list[dict[str, Any]]
    cluster_info: dict[str, Any]
    methodology: str
    agent_iterations: int


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str


# --- Endpoints ---


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/investigate", response_model=InvestigateResponse)
async def investigate_wallet(request: InvestigateRequest):
    """
    Run autonomous forensic investigation on a wallet address.

    This endpoint:
    1. Spawns an InvestigatorAgent (powered by Claude LLM)
    2. Agent iteratively calls tools: fetch_wallet_history, run_insider_detection,
       find_related_wallets, build_cluster_graph, summarize_timeline
    3. Returns a ForensicReport with statistical analysis and cluster discovery

    **Note**: This can take 30-90 seconds depending on cluster size.
    """
    log.info("Received /investigate request for %s", request.address)

    try:
        # Initialize agent
        agent = InvestigatorAgent()

        # Run investigation
        report = agent.investigate(
            seed_address=request.address,
            max_iterations=request.max_iterations,
        )

        log.info("Investigation complete for %s", request.address)
        return InvestigateResponse(**report)

    except Exception as e:
        log.error("Investigation failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Investigation failed: {str(e)}",
        )


@app.get("/case/theo")
async def get_theo_case():
    """
    Get precomputed Theo case study results.

    Returns the full pipeline output from the Polymarket Theo cluster investigation
    (13-wallet cluster, 97.3% win rate, $209M funded, $186M cashed out).

    This is used for the featured case in the Case Library.
    """
    log.info("Fetching precomputed Theo case")

    # Load from examples/case_polymarket_theo_output.json
    output_path = (
        Path(__file__).resolve().parent.parent
        / "examples"
        / "case_polymarket_theo_output.json"
    )

    if not output_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Theo case output not found. Run `python backend/run_pipeline.py` first.",
        )

    try:
        with open(output_path) as f:
            theo_case = json.load(f)

        return theo_case

    except Exception as e:
        log.error("Failed to load Theo case: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load Theo case: {str(e)}",
        )


# --- Main (for local testing with uvicorn) ---

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
