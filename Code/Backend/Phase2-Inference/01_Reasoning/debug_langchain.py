import os
import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

async def test():
    load_dotenv(override=True)
    key = os.getenv("OPENROUTER_API_KEY")
    print(f"Key: {key[:10]}...")
    
    chat = ChatOpenAI(
        model="google/gemini-2.0-flash-exp:free",
        api_key=key,
        base_url="https://openrouter.ai/api/v1",
        timeout=60.0,
        max_retries=2,
    )
    
    try:
        print("Sending request...")
        # Test 1: Simple text
        response = await chat.ainvoke("Hello")
        print(f"Response: {response.content}")
        
        # Test 2: JSON mode (which was likely used when error occurred)
        print("Sending JSON mode request...")
        response_json = await chat.ainvoke(
            "Return JSON: {'foo': 'bar'}", 
            response_format={"type": "json_object"}
        )
        print(f"Response JSON: {response_json.content}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
