from loguru import logger

def query_chain(chain, user_input: str):
    try:
        logger.info(f"Querying {user_input}")
        result = chain.invoke({"input": user_input})
        response={
            "response": result['answer'],
            "sources": [doc.metadata.get("source", "") for doc in result.get('context', [])]
        }
        logger.info(f"Response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in query_chain: {e}")
        raise e