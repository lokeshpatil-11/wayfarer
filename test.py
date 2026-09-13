import asyncio
from mcp_client import get_all_tools
from langchain_mcp_adapters.client import MultiServerMCPClient

# from mcp_client import tavily_mcp_search

if __name__ == "__main__":
    # query = "recent tweet about ai slowdown by antropic ceo plan"
    asyncio.run(get_all_tools())

