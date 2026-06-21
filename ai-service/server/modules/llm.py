import os
from typing import Any, Dict, List
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

load_dotenv()


def get_llm_chain(retriever):
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in .env")

    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    llm = ChatGroq(
        api_key=groq_api_key,
        model=groq_model,
    )

    system_prompt = (
        "You are an AI-powered assistant designed to help answer questions based on the provided context. "
        "Please use the following context to answer the question. If the context does not contain relevant information, "
        "indicate that you don't have enough information to answer the question.\n\n"
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
