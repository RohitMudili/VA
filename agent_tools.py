import json
import os
import time
import pickle
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from livekit.agents.llm import FunctionCall, function_tool
from llama_index.core import Document, VectorStoreIndex, Settings, StorageContext, load_index_from_storage
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.query_engine import BaseQueryEngine, RetrieverQueryEngine
from llama_index.core.response_synthesizers import get_response_synthesizer
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.vector_stores.faiss import FaissVectorStore
import faiss
from pydantic import Field, ConfigDict, BaseModel
from dotenv import load_dotenv
import re
import hashlib
from anyio import to_thread
from llama_index.llms.groq import Groq

class ResponseResponse(BaseModel):
    response_id: str
    content: str
    content_complete: bool
    end_call: bool

load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_KEY:
    raise ValueError("GROQ_KEY environment variable is not set")


OPENAI_API_KEY = os.getenv("OPENAI_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_KEY environment variable is not set")

"""Settings.llm = Groq(
    api_key=GROQ_KEY,
    model="llama-3.1-8b-instant",
    temperature=0.3)"""

Settings.llm = OpenAI(
    api_key=OPENAI_API_KEY,
    model="gpt-4o",
    temperature=0.1,
    max_tokens=150,
    timeout=15,
)
Settings.embed_model = OpenAIEmbedding(
    api_key=OPENAI_API_KEY,
    model="text-embedding-3-small",
    embed_batch_size=10,
    timeout=15,
)

def configure_logging(level: str = "INFO") -> logging.Logger:
    """
    Configure and return a logger for the module.
    """
    logger = logging.getLogger(__name__)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    handler = logging.StreamHandler()
    # Use UTF-8 encoding to handle Unicode characters properly
    if hasattr(handler.stream, 'reconfigure'):
        handler.stream.reconfigure(encoding='utf-8')
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    handler.setFormatter(formatter)
    if not logger.handlers:
        logger.addHandler(handler)
    return logger

class KnowledgeParser:
    """
    Parses a structured knowledge base and builds quick-lookup maps.
    """

    def __init__(self, kb_source: str):
        self.kb_source = kb_source
        self.documents: List[Document] = []
        self.quick_answers: Dict[str, str] = {}
        self.kb_data: Dict[str, Any] = {}
        self._load_kb()

    def _load_kb(self) -> None:
        """
        Load and parse the knowledge base from various formats.
        """
        if isinstance(self.kb_source, str):
            if Path(self.kb_source).exists():
                # Load from file
                path = Path(self.kb_source)
                raw = path.read_text()
                try:
                    self.kb_data = json.loads(raw)
                except json.JSONDecodeError:
                    self.kb_data = self._parse_yaml_like(raw)
            else:
                # Treat as direct content string
                try:
                    self.kb_data = json.loads(self.kb_source)
                except json.JSONDecodeError:
                    self.kb_data = self._parse_yaml_like(self.kb_source)
        
        # Build documents and quick answers from parsed data
        self._build_documents()
        self._build_quick_answers()

    def _parse_yaml_like(self, content: str) -> Dict[str, Any]:
        """Simple parser for YAML-like knowledge base format."""
        try:
            if content.startswith('```yaml'):
                content = content.replace('```yaml', '').replace('```', '').strip()
            
            # Initialize with default structure
            kb_data = {
                "core_value_proposition": {
                    "description": "We generate exclusive, motivated seller leads for real estate investors without websites, ad spend, or tech setup required. Leads arrive in real time, and you only pay for valid leads that meet quality standards.",
                    "delivery_channels": ["email", "sms", "crm"],
                    "pricing": {"model": "pay-per-lead", "start_price_usd": "100", "increment_usd": "25"}
                },
                "common_objections_responses": [
                    {"question": "How do you get these leads?", "answer": "We run marketing across high-performing websites, Google search ads, and social media to attract homeowners actively looking to sell fast."},
                    {"question": "Are the leads exclusive?", "answer": "Yes. Each lead is sent to only one investor in the selected area—no sharing or competing."},
                    {"question": "How much do the leads cost?", "answer": "You choose the price per lead by county (starting at $100). You only pay as leads are delivered."},
                    {"question": "What if a lead is no good?", "answer": "Dispute within 10 days. Invalid leads are credited back to your account."},
                    {"question": "Do I need a website or ad spend?", "answer": "No. We handle all marketing and funnel sellers directly to you."},
                    {"question": "Can I pause or stop at any time?", "answer": "Yes. Pause or cancel anytime. You're only charged for received leads."}
                ],
                "contact_and_support": {
                    "phone": "+1 (305) 771-1557",
                    "support_hours": "Mon–Fri, 9:00 AM – 5:00 PM EST",
                    "dashboard_features": ["dispute submissions", "account management", "budget controls"]
                },
                "service_workflow": [
                    {"step": "1", "title": "Choose Your Market", "details": "Select counties and set price per lead (starting at $100, adjustable in $25 increments)."},
                    {"step": "2", "title": "Set Your Monthly Budget", "details": "No upfront charges. Billing occurs only upon lead delivery. Delivery stops when cap is hit."},
                    {"step": "3", "title": "Lead Delivery", "details": "Real-time via SMS, Email, or CRM (e.g., Podio, RESimpli, FollowUpBoss). Basic quality checks applied."},
                    {"step": "4", "title": "Dispute Bad Leads", "details": "Submit within 10 days for reasons like MLS-listed, mobile home, vacant land, duplicate, wholesaler, wrong number."}
                ],
                "lead_delivery_options": [
                    "Email (multiple addresses supported)",
                    "SMS notifications", 
                    "CRM Integration via Zapier (Podio, RESimpli, Pipedrive, FollowUpBoss)",
                    "Mobile App Dashboard"
                ],
                "performance_expectations": {
                    "note": "Most investors close 1 deal per 15–30 leads depending on follow-up and offer strategy.",
                    "tip": "Faster contact improves conversion."
                },
                "best_practices_for_investors": [
                    "Respond to leads within minutes for best results.",
                    "Use a CRM to track and follow up consistently.",
                    "Qualify quickly—identify pain points and urgency.",
                    "Be empathetic and flexible; many sellers are distressed or need quick solutions."
                ],
                "tech_stack_and_integrations": {
                    "supported_crms": ["RESimpli", "Podio", "Pipedrive", "FollowUpBoss"],
                    "integration_via": "Zapier",
                    "delivery": "Real-time"
                }
            }
            
            return kb_data
            
        except Exception as e:
            logging.error(f"Error parsing YAML-like content: {e}")
            return {
                "common_objections_responses": [],
                "contact_and_support": {"phone": "+1 (305) 771-1557", "support_hours": "Mon–Fri, 9:00 AM – 5:00 PM EST"}
            }

    def _build_documents(self) -> None:
        """Build documents from KB data."""
        # Core value proposition
        if 'core_value_proposition' in self.kb_data:
            core = self.kb_data['core_value_proposition']
            self.documents.append(Document(
                text=core.get('description', ''),
                metadata={"section": "core_value_proposition", "type": "description"}
            ))
            
            pricing_text = f"Pricing: {core.get('pricing', {}).get('model', 'pay-per-lead')}, starting at ${core.get('pricing', {}).get('start_price_usd', '100')} per lead"
            self.documents.append(Document(
                text=pricing_text,
                metadata={"section": "core_value_proposition", "type": "pricing"}
            ))
        
        # Q&A pairs as individual documents
        if 'common_objections_responses' in self.kb_data:
            for qa in self.kb_data['common_objections_responses']:
                self.documents.append(Document(
                    text=f"Q: {qa['question']}\nA: {qa['answer']}",
                    metadata={"section": "qa", "type": "objection_response"}
                ))
        
        # Service workflow
        if 'service_workflow' in self.kb_data:
            for step in self.kb_data['service_workflow']:
                self.documents.append(Document(
                    text=f"Step {step['step']}: {step['title']}\n{step['details']}",
                    metadata={"section": "workflow", "step": step['step']}
                ))
        
        # Contact information
        contact_info = self.kb_data.get('contact_and_support', {})
        contact_text = f"Contact: {contact_info.get('phone', '')} | Hours: {contact_info.get('support_hours', '')}"
        self.documents.append(Document(
            text=contact_text,
            metadata={"section": "contact", "type": "info"}
        ))

    def _build_quick_answers(self) -> None:
        """Build quick answers lookup."""
        contact_info = self.kb_data.get('contact_and_support', {})
        
        self.quick_answers = {
            # Contact info
            "phone": f"Our phone number is {contact_info.get('phone', '+1 (305) 771-1557')}. Support hours: {contact_info.get('support_hours', 'Mon–Fri, 9:00 AM – 5:00 PM EST')}.",
            "contact": f"Our phone number is {contact_info.get('phone', '+1 (305) 771-1557')}. Support hours: {contact_info.get('support_hours', 'Mon–Fri, 9:00 AM – 5:00 PM EST')}.",
            "number": f"Our phone number is {contact_info.get('phone', '+1 (305) 771-1557')}. Support hours: {contact_info.get('support_hours', 'Mon–Fri, 9:00 AM – 5:00 PM EST')}.",
            
            # Pricing
            "price": "You choose the price per lead by county, starting at $100 and adjustable in $25 increments. You only pay as leads are delivered.",
            "cost": "You choose the price per lead by county, starting at $100 and adjustable in $25 increments. You only pay as leads are delivered.",
            "pricing": "You choose the price per lead by county, starting at $100 and adjustable in $25 increments. You only pay as leads are delivered.",
            "how much": "You choose the price per lead by county, starting at $100 and adjustable in $25 increments. You only pay as leads are delivered.",
            
            # Service description
            "what do you do": self.kb_data.get('core_value_proposition', {}).get('description', 'We generate exclusive motivated seller leads for real estate investors.'),
            "service": self.kb_data.get('core_value_proposition', {}).get('description', 'We generate exclusive motivated seller leads for real estate investors.'),
            
            # CRM Integration
            "crm": "We integrate with RESimpli, Podio, Pipedrive, and FollowUpBoss via Zapier for real-time delivery.",
            "integration": "We integrate with RESimpli, Podio, Pipedrive, and FollowUpBoss via Zapier for real-time delivery.",
            "zapier": "We integrate with RESimpli, Podio, Pipedrive, and FollowUpBoss via Zapier for real-time delivery.",
        }

    def keyword_lookup(self, query: str) -> List[str]:
        """
        Return direct quick answers whose keywords appear in the query.
        """
        results = []
        query_lower = query.lower()
        for key, ans in self.quick_answers.items():
            if key.lower() in query_lower:
                results.append(ans)
        return results

class KB(FunctionCall):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    index: Optional[VectorStoreIndex] = Field(default=None)
    query_engine: Optional[BaseQueryEngine] = Field(default=None)
    retriever: Optional[VectorIndexRetriever] = Field(default=None)
    
    # Optimized components
    parser: Optional[KnowledgeParser] = Field(default=None)
    logger: logging.Logger = Field(default=None)
    
    # Caching and performance
    cache: Dict[str, str] = Field(default_factory=dict)
    qa_lookup: Dict[str, str] = Field(default_factory=dict)
    
    # Configuration
    SIMILARITY_TOP_K: int = Field(default=3)
    SIMILARITY_CUTOFF: float = Field(default=0.7)
    FAST_LOOKUP_THRESHOLD: float = Field(default=0.6)
    FAISS_INDEX_PATH: str = Field(default="faiss_index.pkl")
    HNSW_M: int = Field(default=64)
    USE_HNSW: bool = Field(default=False)  # Set to True for larger datasets

    def __init__(self, knowledge_base: str):
        super().__init__(
            name="knowledge_base",
            call_id="kb_1",
            arguments="{}"
        )
        
        # Initialize logger
        self.logger = configure_logging("INFO")
        
        # Parse the knowledge base
        self.parser = KnowledgeParser(knowledge_base)
        
        # Build fast lookup structures
        self._build_fast_lookups()
        
        # Initialize optimized index
        self._init_optimized_index()
        
        # Create retriever
        self._init_retriever()
        
        self.logger.info(f"KB initialized: {len(self.qa_lookup)} Q&As, {len(self.parser.quick_answers)} quick answers")
    
    def _build_fast_lookups(self):
        """Build fast lookup dictionaries for instant responses."""
        # Build Q&A lookup from parsed data
        if 'common_objections_responses' in self.parser.kb_data:
            for qa in self.parser.kb_data['common_objections_responses']:
                question_key = qa['question'].lower().strip()
                self.qa_lookup[question_key] = qa['answer']
                
                # Add variations
                question_clean = question_key.replace('?', '').replace('.', '').strip()
                self.qa_lookup[question_clean] = qa['answer']
    
    def _init_optimized_index(self) -> None:
        """
        Initialize or load a persistent FAISS index with optimized settings.
        """
        THIS_DIR = Path(__file__).parent
        PERSIST_DIR = THIS_DIR / "kb-storage-optimized"
        faiss_path = Path(self.FAISS_INDEX_PATH)
        
        # Try to load existing FAISS index first
        if faiss_path.exists():
            self.logger.info("Loading persisted FAISS index...")
            try:
                with open(faiss_path, "rb") as f:
                    faiss_store = pickle.load(f)
                self.index = VectorStoreIndex(
                    self.parser.documents,
                    vector_store=faiss_store
                )
                self.logger.info("FAISS index loaded successfully")
                return
            except Exception as e:
                self.logger.warning(f"Failed to load FAISS index: {e}, rebuilding...")
        
        # Try to load LlamaIndex storage
        if PERSIST_DIR.exists():
            self.logger.info("Loading LlamaIndex storage...")
            try:
                storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
                self.index = load_index_from_storage(storage_context)
                self.logger.info("LlamaIndex storage loaded successfully")
                return
            except Exception as e:
                self.logger.warning(f"Failed to load LlamaIndex storage: {e}, rebuilding...")
        
        # Build new index
        self.logger.info("Building new optimized vector index...")
        try:
            # Try FAISS first for better performance
            try:
                
                faiss_store = FaissVectorStore.from_documents(
                    self.parser.documents,
                    index_args={"index_type": "HNSW", "hnsw_m": self.HNSW_M}
                )
                self.index = VectorStoreIndex(
                    self.parser.documents,
                    vector_store=faiss_store
                )
                # Persist FAISS index
                with open(faiss_path, "wb") as f:
                    pickle.dump(faiss_store, f)
                self.logger.info("FAISS index created and persisted")
            except (ImportError, AttributeError, Exception) as faiss_error:
                self.logger.warning(f"FAISS creation failed: {faiss_error}, using default index")
                # Fallback to default VectorStoreIndex
                self.index = VectorStoreIndex.from_documents(
                    self.parser.documents,
                    show_progress=False
                )
                # Persist using LlamaIndex storage
                PERSIST_DIR.mkdir(parents=True, exist_ok=True)
                self.index.storage_context.persist(persist_dir=PERSIST_DIR)
                self.logger.info("Default vector index created and persisted")
                
        except Exception as e:
            self.logger.error(f"Failed to create any vector index: {e}")
            raise
    
    def _init_retriever(self) -> None:
        """
        Configure the VectorIndexRetriever with tuned parameters.
        """
        if not self.index:
            raise ValueError("Index must be initialized before creating retriever")
            
        self.retriever = VectorIndexRetriever(
            index=self.index,
            similarity_top_k=self.SIMILARITY_TOP_K,
            search_kwargs={
                "k": self.SIMILARITY_TOP_K,
                "similarity_cutoff": self.SIMILARITY_CUTOFF,
            }
        )
        
        response_synthesizer = get_response_synthesizer(
            response_mode="compact",
            structured_answer_filtering=True
        )
        
        self.query_engine = RetrieverQueryEngine(
            retriever=self.retriever,
            response_synthesizer=response_synthesizer
        )

    @function_tool
    async def get_contact_info(self) -> str:
        """Get the official contact information."""
        contact_info = self.parser.kb_data.get('contact_and_support', {})
        if not contact_info:
            return "Contact information is not available."
        
        phone = contact_info.get('phone', 'Not available')
        hours = contact_info.get('support_hours', 'Not available')
        return f"Our phone number is {phone}. Support hours: {hours}."

    def _clean_text(self, text: str) -> str:
        """Clean text by removing special characters and formatting."""
        # Remove bullet points, asterisks, and other special characters
        text = text.replace('•', '').replace('*', '').replace('-', '')
        
        # Remove any markdown-style formatting
        text = re.sub(r'[*_~]{1,2}(.*?)[*_~]{1,2}', r'\1', text)
        
        # Remove any remaining special characters that might be used for formatting
        text = re.sub(r'[#*_~`\[\](){}<>]', '', text)
        
        # Remove any extra whitespace and normalize spaces
        text = ' '.join(text.split())
        
        return text.strip()

    async def lookup_knowledge(self, query: str) -> str:
        """
        Optimized knowledge lookup with multiple fallback strategies.
        """
        start_time = time.time()
        query_lower = query.lower().strip()
        
        # Stage 1: Cache check
        cache_key = hashlib.md5(query_lower.encode()).hexdigest()
        if cache_key in self.cache:
            self.logger.debug(f"Cache hit in {(time.time() - start_time)*1000:.1f}ms")
            return self.cache[cache_key]
        
        # Stage 2: Contact info (fastest path)
        if any(term in query_lower for term in ['phone', 'contact', 'number', 'call', 'support', 'help', 'reach']):
            response = await self.get_contact_info()
            self.cache[cache_key] = response
            self.logger.debug(f"Contact info in {(time.time() - start_time)*1000:.1f}ms")
            return response
        
        # Stage 3: Quick keyword lookup
        try:
            direct_answers = self.parser.keyword_lookup(query)
            if direct_answers:
                response = direct_answers[0]
                self.cache[cache_key] = response
                self.logger.debug(f"Quick keyword in {(time.time() - start_time)*1000:.1f}ms")
                return response
        except Exception as e:
            self.logger.warning(f"Keyword lookup failed: {e}")
        
        # Stage 4: Direct Q&A lookup with similarity
        for qa_question, answer in self.qa_lookup.items():
            if self._similarity_check(query_lower, qa_question) > self.FAST_LOOKUP_THRESHOLD:
                self.cache[cache_key] = answer
                self.logger.debug(f"Q&A match in {(time.time() - start_time)*1000:.1f}ms")
                return answer
        
        # Stage 5: Vector retrieval (async)
        try:
            if self.retriever:
                docs = await to_thread.run_sync(self.retriever.retrieve, query)
                if docs:
                    texts = [d.text for d in docs]
                    response = self._clean_text("\n---\n".join(texts))
                    self.cache[cache_key] = response
                    self.logger.debug(f"Vector retrieval in {(time.time() - start_time)*1000:.1f}ms")
                    return response
        except Exception as e:
            self.logger.error(f"Vector retrieval failed: {e}")
        
        # Stage 6: Query engine fallback
        try:
            if self.query_engine:
                response = await self.query_engine.aquery(query)
                if response and str(response).strip():
                    cleaned_response = self._clean_text(str(response))
                    self.cache[cache_key] = cleaned_response
                    self.logger.debug(f"Query engine in {(time.time() - start_time)*1000:.1f}ms")
                    return cleaned_response
        except Exception as e:
            self.logger.warning(f"Query engine failed: {e}")
        
        # Stage 7: Fallback search
        fallback_response = self._clean_text(self._fallback_search(query_lower))
        self.cache[cache_key] = fallback_response
        self.logger.debug(f"Fallback in {(time.time() - start_time)*1000:.1f}ms")
        return fallback_response
    
    def _similarity_check(self, query: str, target: str) -> float:
        """Simple similarity check using word overlap."""
        query_words = set(query.split())
        target_words = set(target.split())
        
        if not query_words or not target_words:
            return 0.0
        
        intersection = len(query_words.intersection(target_words))
        union = len(query_words.union(target_words))
        
        return intersection / union if union > 0 else 0.0
    
    def _fallback_search(self, query: str) -> str:
        """Fallback search method for when other methods fail."""
        relevant_info = []
        
        def search_dict(d: Dict, path: str = "") -> None:
            for key, value in d.items():
                current_path = f"{path}.{key}" if path else key
                
                if query in key.lower():
                    relevant_info.append(f"Found in {current_path}:\n{value}")
                
                if isinstance(value, dict):
                    search_dict(value, current_path)
                elif isinstance(value, list):
                    for i, item in enumerate(value):
                        if isinstance(item, dict):
                            search_dict(item, f"{current_path}[{i}]")
                        elif isinstance(item, str) and query in item.lower():
                            relevant_info.append(f"Found in {current_path}:\n- {item}")
                elif isinstance(value, str) and query in value.lower():
                    relevant_info.append(f"Found in {current_path}:\n{value}")
        
        search_dict(self.parser.kb_data)
        
        if not relevant_info:
            # Smart default based on query content
            if any(word in query for word in ['help', 'support', 'assist']):
                return "I can help you with our motivated seller lead service. We provide exclusive leads starting at $100 each. What specific information do you need?"
            elif any(word in query for word in ['start', 'begin', 'get started']):
                return "To get started, call us at +1 (305) 771-1557. You choose your counties and lead pricing (starting at $100), and we handle the rest!"
            else:
                return "I can help with our exclusive motivated seller lead service. We handle all marketing while you get real-time leads starting at $100 each. What would you like to know?"
        
        return "\n\n".join(relevant_info)
    
    def get_performance_stats(self) -> str:
        """
        Get performance statistics for the KB.
        """
        try:
            cache_size = len(self.cache)
            qa_count = len(self.qa_lookup)
            quick_answers_count = len(self.parser.quick_answers) if self.parser else 0
            doc_count = len(self.parser.documents) if self.parser else 0
            
            return f"Cache: {cache_size} entries, Q&As: {qa_count}, Quick answers: {quick_answers_count}, Documents: {doc_count}"
        except Exception as e:
            return f"Stats error: {e}"

    def get_lookup_tool(self):
        """Return a proper function tool for LiveKit"""
        kb_instance = self  # Capture self reference
        
        @function_tool
        async def knowledge_lookup(query: str) -> str:
            """Look up information from the knowledge base.
            
            Args:
                query: The question or topic to search for
                
            Returns:
                str: The relevant information from the knowledge base
            """
            return await kb_instance.lookup_knowledge(query)
        
        return knowledge_lookup

    async def draft_response(self, request, func_result=None):
        """Draft response for the agent."""
        try:
            response = await self.lookup_knowledge(str(request.transcript))
            
            yield ResponseResponse(
                response_id=request.response_id,
                content=response,
                content_complete=True,
                end_call=False,
            )
            
        except Exception as e:
            self.logger.error(f"Error in draft_response: {e}")
            yield ResponseResponse(
                response_id=request.response_id,
                content="I can help you with our motivated seller lead service. What would you like to know about our pricing, process, or contact information?",
                content_complete=True,
                end_call=False,
            )
