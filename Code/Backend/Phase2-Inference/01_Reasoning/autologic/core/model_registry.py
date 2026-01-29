from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class ModelInfo:
    id: str
    name: str
    provider: str


class ModelRegistry:
    """Registre des providers et modèles LLM disponibles."""

    def __init__(self) -> None:
        # 6 providers avec modèles complets triés alphabétiquement
        self.providers: Dict[str, List[str]] = {
            "OpenAI": [
                "chatgpt-4o-latest",
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-0125",
                "gpt-3.5-turbo-1106",
                "gpt-3.5-turbo-16k",
                "gpt-4",
                "gpt-4-0125-preview",
                "gpt-4-0613",
                "gpt-4-1106-preview",
                "gpt-4-32k",
                "gpt-4-turbo",
                "gpt-4-turbo-2024-04-09",
                "gpt-4-turbo-preview",
                "gpt-4-vision-preview",
                "gpt-4o",
                "gpt-4o-2024-05-13",
                "gpt-4o-2024-08-06",
                "gpt-4o-2024-11-20",
                "gpt-4o-mini",
                "gpt-4o-mini-2024-07-18",
                "o1",
                "o1-2024-12-17",
                "o1-mini",
                "o1-mini-2024-09-12",
                "o1-preview",
                "o1-preview-2024-09-12",
                "o3-mini",
                "o3-mini-2025-01-31",
            ],
            "OpenRouter": [
                # Google
                "google/gemini-2.0-flash-exp:free",
                "google/gemini-2.0-flash-lite-preview-02-05:free",
                "google/gemini-2.0-pro-exp-02-05:free",
                "google/gemma-2-9b-it:free",
                # Meta Llama
                "meta-llama/llama-3.3-70b-instruct:free",
                "meta-llama/llama-3.1-8b-instruct:free",
                "meta-llama/llama-3-8b-instruct:free",
                # Mistral (Corrected IDs)
                "mistralai/mistral-7b-instruct",  # Souvent gratuit/très low cost
                "mistralai/mistral-small-24b-instruct-2501",
                "mistralai/mistral-nemo",
                "mistralai/mistral-large-2411",
                "mistralai/mistral-small-3.1-24b-instruct:free",
                # DeepSeek
                "deepseek/deepseek-r1:free",
                "deepseek/deepseek-chat:free",
                # Microsoft
                "microsoft/phi-3-medium-128k-instruct:free",
                "microsoft/phi-3-mini-128k-instruct:free",
                # Autres Payants (mais populaires)
                "openai/gpt-4o",
                "openai/gpt-4o-mini",
                "anthropic/claude-3.5-sonnet",
                "anthropic/claude-3.5-haiku",
                "perplexity/llama-3.1-sonar-large-128k-online",
                "x-ai/grok-2-1212",
            ],
            "Ollama": [
                "codellama",
                "codellama:13b",
                "codellama:34b",
                "codellama:7b",
                "deepseek-coder",
                "deepseek-coder-v2",
                "deepseek-r1",
                "deepseek-r1:14b",
                "deepseek-r1:32b",
                "deepseek-r1:70b",
                "deepseek-r1:7b",
                "gemma",
                "gemma2",
                "gemma2:27b",
                "gemma2:9b",
                "llama2",
                "llama2:13b",
                "llama2:70b",
                "llama3",
                "llama3.1",
                "llama3.1:405b",
                "llama3.1:70b",
                "llama3.1:8b",
                "llama3.2",
                "llama3.2:1b",
                "llama3.2:3b",
                "llama3.2-vision",
                "llama3.3",
                "llama3.3:70b",
                "llama3:70b",
                "llama3:8b",
                "llava",
                "llava:13b",
                "llava:34b",
                "mistral",
                "mistral-nemo",
                "mistral-small",
                "mixtral",
                "mixtral:8x22b",
                "mixtral:8x7b",
                "neural-chat",
                "nomic-embed-text",
                "orca-mini",
                "phi",
                "phi3",
                "phi3:14b",
                "phi3:medium",
                "phi3:mini",
                "phi4",
                "qwen",
                "qwen2",
                "qwen2.5",
                "qwen2.5-coder",
                "qwen2.5:72b",
                "qwq",
                "starcoder2",
                "tinyllama",
                "vicuna",
                "wizardcoder",
                "zephyr",
            ],
            "HuggingFace": [
                "bigcode/starcoder2-15b",
                "codellama/CodeLlama-34b-Instruct-hf",
                "codellama/CodeLlama-70b-Instruct-hf",
                "google/flan-t5-xxl",
                "google/gemma-2-27b-it",
                "google/gemma-2-9b-it",
                "google/gemma-7b",
                "google/gemma-7b-it",
                "HuggingFaceH4/zephyr-7b-beta",
                "meta-llama/Llama-2-13b-chat-hf",
                "meta-llama/Llama-2-70b-chat-hf",
                "meta-llama/Llama-2-7b-chat-hf",
                "meta-llama/Llama-3.2-11B-Vision-Instruct",
                "meta-llama/Llama-3.2-1B-Instruct",
                "meta-llama/Llama-3.2-3B-Instruct",
                "meta-llama/Meta-Llama-3-70B-Instruct",
                "meta-llama/Meta-Llama-3-8B-Instruct",
                "meta-llama/Meta-Llama-3.1-405B-Instruct",
                "meta-llama/Meta-Llama-3.1-70B-Instruct",
                "meta-llama/Meta-Llama-3.1-8B-Instruct",
                "microsoft/Phi-3-medium-128k-instruct",
                "microsoft/Phi-3-mini-128k-instruct",
                "microsoft/Phi-3-mini-4k-instruct",
                "microsoft/phi-4",
                "mistralai/Mistral-7B-Instruct-v0.2",
                "mistralai/Mistral-7B-Instruct-v0.3",
                "mistralai/Mistral-Nemo-Instruct-2407",
                "mistralai/Mixtral-8x22B-Instruct-v0.1",
                "mistralai/Mixtral-8x7B-Instruct-v0.1",
                "Qwen/Qwen2-72B-Instruct",
                "Qwen/Qwen2.5-72B-Instruct",
                "Qwen/Qwen2.5-Coder-32B-Instruct",
                "tiiuae/falcon-180B-chat",
                "tiiuae/falcon-40b-instruct",
            ],
            "Anthropic": [
                "claude-2.0",
                "claude-2.1",
                "claude-3-5-haiku-20241022",
                "claude-3-5-haiku-latest",
                "claude-3-5-sonnet-20240620",
                "claude-3-5-sonnet-20241022",
                "claude-3-5-sonnet-latest",
                "claude-3-haiku-20240307",
                "claude-3-opus-20240229",
                "claude-3-opus-latest",
                "claude-3-sonnet-20240229",
                "claude-instant-1.2",
            ],
            "Cohere": [
                "c4ai-aya-23-35b",
                "c4ai-aya-23-8b",
                "c4ai-aya-expanse-32b",
                "c4ai-aya-expanse-8b",
                "command",
                "command-a-03-2025",
                "command-light",
                "command-light-nightly",
                "command-nightly",
                "command-r",
                "command-r-03-2024",
                "command-r-08-2024",
                "command-r-plus",
                "command-r-plus-04-2024",
                "command-r-plus-08-2024",
                "command-r7b-12-2024",
                "embed-english-light-v3.0",
                "embed-english-v3.0",
                "embed-multilingual-light-v3.0",
                "embed-multilingual-v3.0",
                "rerank-english-v3.0",
                "rerank-multilingual-v3.0",
            ],
        }

        # Paramètres par défaut pour chaque provider
        self.default_params: Dict[str, Dict[str, Any]] = {
            "OpenAI": {"temperature": 0.7, "max_tokens": 4096, "top_p": 1.0},
            "OpenRouter": {"temperature": 0.7, "max_tokens": 4096, "top_p": 1.0},
            "Ollama": {"temperature": 0.8, "max_tokens": 2048, "top_p": 0.9},
            "HuggingFace": {"temperature": 0.7, "max_tokens": 2048, "top_p": 0.95},
            "Anthropic": {"temperature": 1.0, "max_tokens": 4096, "top_p": 1.0},
            "Cohere": {"temperature": 0.7, "max_tokens": 4000, "top_p": 0.75},
        }

    def get_providers(self) -> List[str]:
        """Retourne la liste des providers triée alphabétiquement."""
        return sorted(list(self.providers.keys()))

    def get_models_by_provider(self, provider: str) -> List[str]:
        """Retourne les modèles d'un provider triés alphabétiquement."""
        if provider not in self.providers:
            return []
        return sorted(self.providers[provider])

    def get_all_models(self) -> Dict[str, List[str]]:
        """Retourne tous les modèles groupés par provider."""
        return {p: sorted(m) for p, m in self.providers.items()}

    def get_default_params(self, provider: str) -> Dict[str, Any]:
        """Retourne les paramètres par défaut pour un provider."""
        return self.default_params.get(provider, {"temperature": 0.7, "max_tokens": 2048, "top_p": 1.0})
