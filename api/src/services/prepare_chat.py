"""Prepare flow chat: business discovery and document upload coaching (OpenAI)."""

from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from src.constants import DOCUMENT_CATEGORIES

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
MAX_MESSAGES = 28

BUSINESS_SYSTEM = """You are Continuity, an assistant helping a business owner prepare for a potential sale \
or transition (M&A and due diligence context).

Goals:
- Understand their business through a natural conversation.
- Ask **one clear follow-up at a time**, informed by what they already said in this chat.
- Cover, over time: what they do, industry, scale (rough revenue or headcount if appropriate), \
customers, operations, team, and growth—when it fits the conversation (do not interrogate mechanically).

Style:
- Warm, concise (under ~150 words unless they wrote a lot).
- Use Markdown: put the main question in **bold**.
- Do not fabricate facts about their company; only ask and reflect.
- If they go off-topic briefly, acknowledge and steer back gently.
"""

DOCUMENTS_PICK_SYSTEM = """The user is in the **document upload** step of preparing for due diligence.

They will choose a document category from a list in the UI (categories match standard seller due diligence folders).

Your task:
- If they ask what to do: tell them to **pick a category below** to see tailored upload guidance.
- If they sent other messages: answer briefly and remind them to select a category when ready.
- Do **not** invent that they already uploaded files unless they said so.
- Keep it short (under ~100 words). Use **bold** for the key instruction."""

DOCUMENTS_CATEGORY_SYSTEM_TEMPLATE = """The user is uploading due diligence documents for this category **only**:
{category}

Valid categories in this product are exactly:
{categories_list}

Your task:
- Briefly explain why this category matters to buyers.
- Give a bullet list of 4–7 concrete examples of documents they might upload (specific to this category).
- Tell them they can attach files with the **+** or upload control in the chat.
- Invite them to upload what they have; note redacted or draft versions are okay when needed.
- Keep it under ~180 words. Use **bold** for the main call to action.
"""


def _trim_messages(messages: list[tuple[str, str]]) -> list[tuple[str, str]]:
    if len(messages) <= MAX_MESSAGES:
        return messages
    return messages[-MAX_MESSAGES:]


def run_prepare_chat(
    messages: list[tuple[str, str]],
    *,
    stage: str,
    active_document_category: str | None,
    openai_api_key: str,
    openai_model: str = DEFAULT_OPENAI_MODEL,
) -> str:
    """
    messages: (role, content) with role in {"user","assistant"}; content non-empty text.
    stage: "business" | "documents"
    """
    trimmed = _trim_messages(messages)
    lc_messages: list[SystemMessage | HumanMessage | AIMessage] = []

    if stage == "business":
        lc_messages.append(SystemMessage(content=BUSINESS_SYSTEM))
    elif stage == "documents":
        if active_document_category:
            if active_document_category not in DOCUMENT_CATEGORIES:
                raise ValueError("Invalid document category")
            cats = "\n".join(f"- {c}" for c in DOCUMENT_CATEGORIES)
            lc_messages.append(
                SystemMessage(
                    content=DOCUMENTS_CATEGORY_SYSTEM_TEMPLATE.format(
                        category=active_document_category,
                        categories_list=cats,
                    )
                )
            )
        else:
            lc_messages.append(SystemMessage(content=DOCUMENTS_PICK_SYSTEM))
    else:
        raise ValueError("Invalid stage")

    for role, content in trimmed:
        text = (content or "").strip()
        if not text:
            continue
        if role == "user":
            lc_messages.append(HumanMessage(content=text))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=text))

    llm = ChatOpenAI(model=openai_model, api_key=openai_api_key, temperature=0.1)
    response = llm.invoke(lc_messages)
    out = (response.content or "").strip()
    if not out:
        return "I'm here to help—could you say a bit more so I can respond?"
    return out
