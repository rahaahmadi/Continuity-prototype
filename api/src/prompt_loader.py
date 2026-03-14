"""Load prompt definitions from YAML files and build LangChain ChatPromptTemplates."""

from pathlib import Path

import yaml
from langchain_core.prompts import ChatPromptTemplate

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
_cache: dict[str, ChatPromptTemplate] = {}


def _load_yaml(name: str) -> dict:
    """Load a prompt YAML file by name (e.g. 'document_insights' -> document_insights.yaml)."""
    path = _PROMPTS_DIR / f"{name}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_prompt(name: str) -> ChatPromptTemplate:
    """
    Load a prompt by name and return a ChatPromptTemplate.

    Uses an in-memory cache so each prompt file is only read once.

    Args:
        name: Prompt name without extension (e.g. 'document_insights', 'business_overview').

    Returns:
        ChatPromptTemplate built from the prompt's messages.

    Raises:
        FileNotFoundError: If no YAML file exists for the given name.
    """
    if name in _cache:
        return _cache[name]
    data = _load_yaml(name)
    messages = data.get("messages") or []
    if not messages:
        raise ValueError(f"Prompt '{name}' has no 'messages' list.")
    tuples = [(m["role"], m["content"].strip()) for m in messages]
    template = ChatPromptTemplate.from_messages(tuples)
    _cache[name] = template
    return template


def get_prompt_raw(name: str) -> dict:
    """
    Load raw prompt data (e.g. for inspection or custom use).

    Args:
        name: Prompt name without extension.

    Returns:
        Parsed YAML dict with keys such as 'name', 'description', 'messages'.
    """
    return _load_yaml(name)
