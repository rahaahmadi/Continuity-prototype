"""Business profile widgets aggregation service."""

import re
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document

# Must match classifier labels in src.constants.DOCUMENT_CATEGORIES
FINANCIAL_INFORMATION_CATEGORY = "FINANCIAL INFORMATION"
CUSTOMERS_AND_SALES_CATEGORY = "CUSTOMERS & SALES"


def _is_cohort_or_rollup_customer_name(name: str) -> bool:
    """
    True if the string looks like a concentration roll-up label, not a real customer name.
    Catches mis-extractions ('Top 1 customer', metric-column text, etc.).
    """
    raw = (name or "").strip()
    if not raw:
        return False
    n = raw.lower()
    if " as % of" in n and "customer" in n:
        return True
    if re.search(r"^top\s*(10|[1-9]|\d{2,})\s+customers\b", n):
        return True
    if re.search(r"^top\s*(10|[1-9]|\d{2,})\s+customer\b", n):
        return True
    if re.search(r"^top\s*\d+\s+customers?\s+as\b", n):
        return True
    return False


@dataclass
class InsightPoint:
    period: str
    value_raw: str
    value_numeric: float | None


@dataclass
class BusinessProfileWidgetsResult:
    status: str  # none | pending | ready
    readiness_score: int
    readiness_completed_checks: int
    readiness_total_checks: int
    business_snapshot: dict
    revenue_trend_points: list[dict]
    financial_highlights: dict
    customer_concentration: dict


def _parse_numeric(value: str | None) -> float | None:
    if not value:
        return None
    text = value.strip().replace(",", "")
    if not text:
        return None

    multiplier = 1.0
    lowered = text.lower()
    if lowered.endswith("k"):
        multiplier = 1_000.0
        text = text[:-1]
    elif lowered.endswith("m"):
        multiplier = 1_000_000.0
        text = text[:-1]
    elif lowered.endswith("b"):
        multiplier = 1_000_000_000.0
        text = text[:-1]

    text = text.replace("$", "").replace("%", "").strip()
    match = re.search(r"-?\d+(\.\d+)?", text)
    if not match:
        return None
    try:
        return float(match.group(0)) * multiplier
    except ValueError:
        return None


def _to_point(item: dict | None) -> InsightPoint | None:
    if not isinstance(item, dict):
        return None
    period = str(item.get("period") or "").strip()
    value_raw = str(item.get("value") or "").strip()
    if not period or not value_raw:
        return None
    return InsightPoint(period=period, value_raw=value_raw, value_numeric=_parse_numeric(value_raw))


def _merge_points(docs: list, key: str) -> list[dict]:
    seen: dict[str, InsightPoint] = {}
    for doc in docs:
        insights = doc.insights if isinstance(doc.insights, dict) else {}
        points = insights.get(key)
        if not isinstance(points, list):
            continue
        for raw in points:
            point = _to_point(raw if isinstance(raw, dict) else None)
            if point is None:
                continue
            # Newer docs win because docs are ordered DESC.
            seen.setdefault(point.period, point)
    return [
        {
            "period": p.period,
            "value_raw": p.value_raw,
            "value_numeric": p.value_numeric,
        }
        for p in sorted(seen.values(), key=lambda p: p.period)
    ]


def _financial_information_docs(docs: list) -> list:
    """Documents classified as financial statements / P&L — used for aggregate revenue trends."""
    return [
        d
        for d in docs
        if (d.classification or "").strip() == FINANCIAL_INFORMATION_CATEGORY
    ]


def _customers_and_sales_docs(docs: list) -> list:
    """Documents classified as customer / sales — used for named top-customer lists (pie chart)."""
    return [
        d
        for d in docs
        if (d.classification or "").strip() == CUSTOMERS_AND_SALES_CATEGORY
    ]


def _first_non_empty(docs: list, key: str):
    for doc in docs:
        insights = doc.insights if isinstance(doc.insights, dict) else {}
        value = insights.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if value is not None and not isinstance(value, (str, list, dict)):
            return value
    return None


def _first_positive_int(docs: list, key: str) -> int | None:
    for doc in docs:
        insights = doc.insights if isinstance(doc.insights, dict) else {}
        value = insights.get(key)
        if isinstance(value, int) and value >= 0:
            return value
    return None


def _first_float(docs: list, key: str) -> float | None:
    for doc in docs:
        insights = doc.insights if isinstance(doc.insights, dict) else {}
        value = insights.get(key)
        if isinstance(value, (int, float)):
            return float(value)
    return None


def _merge_string_lists(docs: list, key: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for doc in docs:
        insights = doc.insights if isinstance(doc.insights, dict) else {}
        values = insights.get(key)
        if not isinstance(values, list):
            continue
        for value in values:
            if not isinstance(value, str):
                continue
            item = value.strip()
            if not item or item in seen:
                continue
            seen.add(item)
            out.append(item)
    return out


def _merge_top_customers(docs: list) -> list[dict]:
    out: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for doc in docs:
        insights = doc.insights if isinstance(doc.insights, dict) else {}
        customers = insights.get("top_customers")
        if not isinstance(customers, list):
            continue
        for item in customers:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name") or "").strip() or "Unknown customer"
            if _is_cohort_or_rollup_customer_name(name):
                continue
            revenue = str(item.get("revenue") or "").strip() or None
            pct = str(item.get("percentage_of_revenue") or "").strip() or None
            period = str(item.get("period") or "").strip() or None
            dedupe_key = (name, pct or "", period or "")
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            out.append(
                {
                    "name": name,
                    "revenue": revenue,
                    "percentage_of_revenue": pct,
                    "period": period,
                }
            )
    return out


def _compute_readiness(snapshot: dict, financial: dict, concentration: dict) -> tuple[int, int, int]:
    checks: list[bool] = [
        bool(snapshot.get("entity_type")),
        snapshot.get("years_operating") is not None,
        snapshot.get("headcount") is not None,
        bool(snapshot.get("trailing_revenue")),
        bool(snapshot.get("trailing_ebitda")),
        len(financial.get("revenue_trend_points", [])) > 0,
        len(financial.get("gross_profit_by_period", [])) > 0,
        len(financial.get("gross_margin_pct_by_period", [])) > 0,
        len(financial.get("cash_and_equivalents_by_period", [])) > 0,
        len(financial.get("ebitda_by_period", [])) > 0,
        bool(financial.get("ebitda_margin")),
        len(concentration.get("top_customers", [])) > 0,
        len(concentration.get("percentages", [])) > 0,
    ]
    completed = sum(1 for ok in checks if ok)
    total = len(checks)
    score = int(round((completed / total) * 100)) if total else 0
    return score, completed, total


async def get_business_profile_widgets(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> BusinessProfileWidgetsResult:
    docs_result = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
    )
    docs = list(docs_result.scalars().all())

    if not docs:
        return BusinessProfileWidgetsResult(
            status="none",
            readiness_score=0,
            readiness_completed_checks=0,
            readiness_total_checks=13,
            business_snapshot={},
            revenue_trend_points=[],
            financial_highlights={},
            customer_concentration={},
        )

    has_pending = any((d.insights_status or "none") == "pending" for d in docs)

    business_snapshot = {
        "entity_type": _first_non_empty(docs, "entity_type"),
        "years_operating": _first_float(docs, "years_operating"),
        "headcount": _first_positive_int(docs, "headcount"),
        "trailing_revenue": _first_non_empty(docs, "trailing_revenue"),
        "trailing_ebitda": _first_non_empty(docs, "trailing_ebitda"),
    }
    # Aggregate revenue trend: only merge from FINANCIAL INFORMATION (excludes customer concentration docs).
    revenue_trend_points = _merge_points(
        _financial_information_docs(docs), "revenue_trend_points"
    )
    financial_highlights = {
        "ebitda_margin": _first_non_empty(docs, "ebitda_margin"),
        "debt_summary": _merge_string_lists(docs, "debt_summary"),
        "working_capital_flags": _merge_string_lists(docs, "working_capital_flags"),
        "gross_profit_by_period": _merge_points(docs, "gross_profit_by_period"),
        "gross_margin_pct_by_period": _merge_points(docs, "gross_margin_pct_by_period"),
        "cash_and_equivalents_by_period": _merge_points(
            docs, "cash_and_equivalents_by_period"
        ),
        "ebitda_by_period": _merge_points(docs, "ebitda_by_period"),
        "ebitda_margin_pct_by_period": _merge_points(docs, "ebitda_margin_pct_by_period"),
        "debt_total_by_period": _merge_points(docs, "debt_total_by_period"),
        "revenue_trend_points": revenue_trend_points,
    }
    fin_docs = _financial_information_docs(docs)
    customer_docs = _customers_and_sales_docs(docs)
    # Named-customer pie: only CUSTOMERS & SALES (excludes financial roll-up tables in top_customers).
    # Roll-up metrics: only from FINANCIAL INFORMATION.
    customer_concentration = {
        "top_customers": _merge_top_customers(customer_docs),
        "percentages": _merge_string_lists(fin_docs, "customer_concentration_percentages"),
        "risk_tier": _first_non_empty(fin_docs, "customer_concentration_risk_tier"),
    }

    score, completed, total = _compute_readiness(
        business_snapshot, financial_highlights, customer_concentration
    )

    status = "pending" if has_pending else "ready"
    return BusinessProfileWidgetsResult(
        status=status,
        readiness_score=score,
        readiness_completed_checks=completed,
        readiness_total_checks=total,
        business_snapshot=business_snapshot,
        revenue_trend_points=revenue_trend_points,
        financial_highlights=financial_highlights,
        customer_concentration=customer_concentration,
    )

