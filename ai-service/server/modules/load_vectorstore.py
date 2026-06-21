import os
import time
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from server.modules.embeddings import (
    create_embedding_model,
    format_embedding_error,
    get_embedding_dimension,
)

load_dotenv()

PINECONE_ENVIRONMENT = "us-east-1"
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "medical-index")
EMBEDDING_DIMENSION = get_embedding_dimension()

UPLOAD_DIR = "./uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _extract_index_dimension(index_description):
    dimension = getattr(index_description, "dimension", None)
    if dimension is not None:
        return dimension
    if isinstance(index_description, dict):
        return index_description.get("dimension")
    return None


def _get_index():
    pinecone_api_key = os.getenv("PINECONE_API_KEY")

    if not pinecone_api_key:
        raise ValueError("PINECONE_API_KEY not found in .env")

    pc = Pinecone(api_key=pinecone_api_key)
    spec = ServerlessSpec(cloud="aws", region=PINECONE_ENVIRONMENT)
    existing_indexes = [idx.name for idx in pc.list_indexes()]

    if PINECONE_INDEX_NAME not in existing_indexes:
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=spec,
        )
        while not pc.describe_index(PINECONE_INDEX_NAME).status.ready:
            print("Waiting for Pinecone index to be ready...")
            time.sleep(5)
    else:
        current_dimension = _extract_index_dimension(pc.describe_index(PINECONE_INDEX_NAME))
        if current_dimension and int(current_dimension) != EMBEDDING_DIMENSION:
            raise ValueError(
                f"Pinecone index dimension mismatch: index={current_dimension}, expected={EMBEDDING_DIMENSION}. "
                "Set EMBEDDING_DIMENSION to match index, or recreate the index."
            )

    return pc.Index(PINECONE_INDEX_NAME)


# Load PDF, split into chunks, generate embeddings, and upsert to Pinecone
def load_vectorstore(uploaded_files):
    index = _get_index()
    embed_model = create_embedding_model()
    file_paths = []
    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            f.write(file.file.read())
        file_paths.append(save_path)

    for file_path in file_paths:
        loader = PyPDFLoader(str(file_path))
        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)

        texts = [chunk.page_content for chunk in chunks]
        metadatas = [
            {"text": chunk.page_content, "source": chunk.metadata.get("source", str(file_path))}
            for chunk in chunks
        ]
        ids = [f"{Path(file_path).stem}_{i}" for i in range(len(chunks))]

        print("Generating embeddings and upserting to Pinecone...")
        try:
            embeddings = embed_model.embed_documents(texts)
        except Exception as embedding_error:
            raise ValueError(format_embedding_error(embedding_error)) from embedding_error

        with tqdm(total=len(embeddings), desc="Upserting to Pinecone") as pbar:
            for i in range(0, len(embeddings), 100):
                batch_embeddings = embeddings[i : i + 100]
                batch_ids = ids[i : i + 100]
                batch_metadatas = metadatas[i : i + 100]
                index.upsert(vectors=list(zip(batch_ids, batch_embeddings, batch_metadatas)))
                pbar.update(len(batch_embeddings))

        print("Finished processing:", file_path)