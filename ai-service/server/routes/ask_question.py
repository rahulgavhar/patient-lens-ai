from fastapi import APIRouter, Form, Request
from fastapi.responses import JSONResponse
from server.modules.llm import get_llm_chain
from server.modules.query_handlers import query_chain
from server.modules.embeddings import create_embedding_model, format_embedding_error
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from pinecone import Pinecone
from loguru import logger
from dotenv import load_dotenv
from server.modules.database import save_chat, get_chat_history
from typing import List
import os


load_dotenv()
router = APIRouter()


class SimpleRetriever(BaseRetriever):
    documents: List[Document]

    def _get_relevant_documents(self, query: str, *, run_manager=None) -> List[Document]:
        return self.documents


@router.post("/ask_question")
async def ask_question(request: Request, question: str = Form(...)):
    try:
        logger.info(f"Received question: {question}")

        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        groq_api_key = os.getenv("GROQ_API_KEY")
        pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "medical-index")
        username = request.headers.get("x-user-username") or "default"

        if not pinecone_api_key:
            return JSONResponse(
                content={"error": "Missing required PINECONE_API_KEY in .env"},
                status_code=400,
            )

        pc = Pinecone(api_key=pinecone_api_key)

        docs = []
        try:
            existing_indexes = [idx.name for idx in pc.list_indexes()]
            if pinecone_index_name in existing_indexes:
                index = pc.Index(pinecone_index_name)
                embed_model = create_embedding_model()
                try:
                    embedding_query = embed_model.embed_query(question)
                    res = index.query(vector=embedding_query, top_k=5, include_metadata=True, namespace=username)
                    matches = res.get("matches", []) if isinstance(res, dict) else getattr(res, "matches", [])
                    docs = [
                        Document(
                            page_content=match.get("metadata", {}).get("text", ""),
                            metadata={"source": match.get("metadata", {}).get("source", "")},
                        )
                        for match in matches
                    ]
                except Exception as query_err:
                    logger.warning(f"Error querying Pinecone: {query_err}. Proceeding with empty context.")
            else:
                logger.info(f"Pinecone index '{pinecone_index_name}' not found. Proceeding with empty context.")
        except Exception as list_err:
            logger.warning(f"Failed to check Pinecone index existence: {list_err}. Proceeding with empty context.")

        retriever = SimpleRetriever(documents=docs)
        llm_chain = get_llm_chain(retriever, api_key=groq_api_key)
        response = query_chain(llm_chain, question)
        logger.info(f"Response: {response}")
        
        # Save chat interaction in database
        try:
            ans = response.get("answer", "")
            save_chat(username, question, ans)
        except Exception as db_err:
            logger.error(f"Failed to persist chat record in Postgres: {db_err}")

        return JSONResponse(content=response)

    except Exception as e:
        logger.error(f"Error in ask_question: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/chat_history")
async def chat_history(request: Request):
    try:
        username = request.headers.get("x-user-username") or "default"
        logger.info(f"Fetching chat history from database for user: {username}")
        history = get_chat_history(username)
        return JSONResponse(content=history)
    except Exception as e:
        logger.error(f"Error in fetching chat history: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)