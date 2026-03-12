import os
import json
import logging
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from eth_account import Account
import secrets
import hashlib

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        self.rpc_url = os.getenv("WEB3_PROVIDER_URI", "http://127.0.0.1:8545")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.private_key = os.getenv("WEB3_PRIVATE_KEY")
        self.contract_address = os.getenv("SUPPLY_CHAIN_CONTRACT_ADDRESS")
        
        # Load ABI (dummy ABI for now, replace when compiling actual contract if needed)
        self.contract_abi = [
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "internalType": "bytes32", "name": "optimizationId", "type": "bytes32"},
                    {"indexed": False, "internalType": "string", "name": "depotId", "type": "string"},
                    {"indexed": False, "internalType": "string", "name": "destinations", "type": "string"},
                    {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "name": "RouteOptimized",
                "type": "event"
            },
            {
                "inputs": [
                    {"internalType": "bytes32", "name": "_optimizationId", "type": "bytes32"},
                    {"internalType": "string", "name": "_depotId", "type": "string"},
                    {"internalType": "string", "name": "_destinations", "type": "string"},
                    {"internalType": "int256", "name": "_totalCostUsd", "type": "int256"},
                    {"internalType": "string", "name": "_savingsVsBaseline", "type": "string"}
                ],
                "name": "recordOptimization",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]

        if self.private_key and self.w3.is_connected() and self.contract_address:
            # Set up account
            self.account = Account.from_key(self.private_key)
            self.w3.middleware_onion.add(construct_sign_and_send_raw_middleware(self.account))
            self.w3.eth.default_account = self.account.address
            self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.contract_abi)
            logger.info(f"Connected to Ethereum node at {self.rpc_url} with account {self.account.address}")
        else:
            logger.warning("Blockchain integration is not fully configured (missing private key or node unavailable). Running in mock mode.")
            self.contract = None

    def record_route_optimization(self, depot_id: str, destinations: list, total_cost_usd: float, savings_vs_baseline: str) -> dict:
        """Record a route optimization event onto the blockchain."""
        import time
        # Create a unique 32-byte hash for this optimization
        raw_data = f"{depot_id}-{','.join(destinations)}-{time.time()}-{secrets.token_hex(4)}"
        optimization_id = hashlib.sha256(raw_data.encode()).digest()

        destinations_str = ",".join(destinations)

        logger.info(f"Attempting to record optimization {optimization_id.hex()} to blockchain...")

        if not self.contract:
            logger.info("Mock Mode: Did not send to blockchain. Outputting transaction log locally.")
            return {
                "status": "mocked",
                "optimization_id": optimization_id.hex(),
                "tx_hash": f"0xmock{secrets.token_hex(30)}",
                "message": "Blockchain not configured, logged locally."
            }

        try:
            # Convert float cost to int (cents) to avoid decimals in solidity
            cost_cents = int(total_cost_usd * 100)
            
            # Build transaction
            tx = self.contract.functions.recordOptimization(
                optimization_id,
                depot_id,
                destinations_str,
                cost_cents,
                savings_vs_baseline
            ).transact()
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            
            logger.info(f"Successfully recorded optimization on blockchain! Tx Hash: {receipt.transactionHash.hex()}")
            return {
                "status": "success",
                "optimization_id": optimization_id.hex(),
                "tx_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber
            }
        except Exception as e:
            logger.error(f"Error interacting with blockchain: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

# Instantiate singleton service
blockchain_service = BlockchainService()
