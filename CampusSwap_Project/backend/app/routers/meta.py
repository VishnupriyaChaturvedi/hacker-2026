"""Meta endpoint: dropdown options for categories and conditions."""

from __future__ import annotations

from fastapi import APIRouter

from ..schemas import CATEGORIES, CONDITIONS, Meta

router = APIRouter(tags=["meta"])


@router.get("/meta", response_model=Meta)
def get_meta() -> Meta:
    return Meta(categories=CATEGORIES, conditions=CONDITIONS)
