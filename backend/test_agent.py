from uagents import Agent, Context, Model, Bureau
# Model - message model 

class WalletRequest(Model):
    address: str
    
class WalletResponse(Model):
    result: str
    

orchestrator = Agent(name="orchestrator", seed="orchestrator_seed")


analyzer = Agent(name="analyzer", seed="analyzer_seed")

# every 5 seconds, orchestrator trigger this functions 
@orchestrator.on_interval(period=5.0)
async def send_request(ctx: Context):
    ctx.logger.info("Sending Wallet Analysis Request")
    await ctx.send(analyzer.address, WalletRequest(
         address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    ))
    
@analyzer.on_message(model=WalletRequest)
async def handle_request(ctx: Context, sender: str, msg: WalletRequest):
    ctx.logger.info(f"Request Received, Analyze Wallet: {msg.address}")
    await ctx.send(sender, WalletResponse(
        result=f"wallet {msg.address[:10]} ... analyze complete, risk level: medium"
    ))

@orchestrator.on_message(model=WalletResponse)
async def handle_response(ctx: Context, sender: str, msg: WalletResponse):
    ctx.logger.info(f"result received: {msg.result}")

if __name__ == "__main__":
    bureau = Bureau()
    bureau.add(orchestrator)
    bureau.add(analyzer)
    bureau.run()
    