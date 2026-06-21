import os
from typing import Any, Dict, List
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

load_dotenv()


def get_llm_chain(retriever, api_key=None):
    groq_api_key = api_key or os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in request headers or .env")

    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    llm = ChatGroq(
        api_key=groq_api_key,
        model=groq_model,
    )

    system_prompt = (
        "You are an AI-powered medical assistant designed to help answer health and medical questions. "
        "Your scope is strictly limited to medicine, healthcare, biology, clinical files, and patient care.\n\n"
        "Domain Scope Guardrails:\n"
        "1. You must ONLY answer questions that are related to medical topics, health, biology, clinical records, or hospital workflows.\n"
        "2. If the user asks a question that is irrelevant or unrelated to medical science (e.g. coding help, writing essays, recipes, business, unrelated trivia, etc.), you must politely decline to answer, explaining that you are a medical assistant restricted to healthcare questions.\n"
        "3. Basic greetings (e.g., 'hi', 'hello', 'good morning') are allowed to be answered politely, but keep it brief and prompt the user to ask a medical or clinical question.\n\n"
        "Use the provided context to answer the question if it is relevant. If no context is provided or the context does not contain the answer, "
        "rely on your general clinical knowledge to formulate a helpful response.\n\n"
        "Context:\n{context}\n\n"
        "Note: Respond in a clear and concise manner. Do not give medical advice."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )

    prompt_chain = prompt | llm

    def _invoke(payload: Dict[str, Any]) -> Dict[str, Any]:
        question = payload.get("input", "")
        docs: List[Document] = retriever.invoke(question)
        context_text = "\n\n".join(doc.page_content for doc in docs)
        llm_response = prompt_chain.invoke({"input": question, "context": context_text})
        answer = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
        return {"answer": answer, "context": docs}

    return RunnableLambda(_invoke)
