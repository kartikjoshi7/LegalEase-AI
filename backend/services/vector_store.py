import chromadb
from chromadb.config import Settings

# We keep a global reference to the ephemeral client
_chroma_client = None

def get_chroma_client():
    """
    Returns the ephemeral ChromaDB client instance.
    """
    global _chroma_client
    if _chroma_client is None:
        raise RuntimeError("ChromaDB has not been initialized.")
    return _chroma_client

def initialize_vector_store():
    """
    Initializes the in-memory ChromaDB vector store and loads statutory baselines.
    This is called once during FastAPI startup.
    """
    global _chroma_client
    print("Initializing ephemeral ChromaDB...")
    
    _chroma_client = chromadb.EphemeralClient()
    
    # Create or get the statutory baselines collection
    collection = _chroma_client.create_collection(name="statutory_baselines")
    
    # TODO: Load standard market baselines here later in development
    # collection.add(
    #     documents=["Standard force majeure...", "Standard indemnification..."],
    #     metadatas=[{"type": "residential_lease"}, {"type": "freelance_nda"}],
    #     ids=["id1", "id2"]
    # )
    
    print("Vector store initialized successfully.")
