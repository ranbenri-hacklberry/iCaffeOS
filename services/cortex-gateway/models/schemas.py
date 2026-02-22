"""
Cortex Gateway — Pydantic request / response schemas.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────

BusinessType = Literal["IT_LAB", "LAW_FIRM", "CAFE"]
Tone         = Literal["professional", "friendly", "technical", "casual"]


# ── Chat ─────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query:         str          = Field(..., min_length=1, max_length=4000)
    tenant_id:     str          = Field(..., description="UUID of the business_config row")
    business_type: BusinessType
    record_id:     Optional[str] = Field(None, description="UUID of the active entity record")
    session_id:    Optional[str] = None
    tone:          Tone          = "professional"


class StatusEvent(BaseModel):
    type:    Literal["status"]
    message: str


class ChunkEvent(BaseModel):
    type:    Literal["chunk"]
    content: str


class DoneEvent(BaseModel):
    type:       Literal["done"]
    session_id: str


class ErrorEvent(BaseModel):
    type:    Literal["error"]
    message: str


# ── Onboarding ───────────────────────────────────────────────────────

class OnboardingRequest(BaseModel):
    business_name:      str            = Field(..., min_length=1, max_length=120)
    business_type:      BusinessType
    core_entities:      List[str]      = Field(default_factory=list)
    tone_of_voice:      Tone           = "professional"
    custom_instructions: Optional[str] = ""


class OnboardingResponse(BaseModel):
    success:   bool
    tenant_id: str
    message:   str


# ── Context Picker ───────────────────────────────────────────────────

class RecordItem(BaseModel):
    id:      str
    display: str


class RecordListResponse(BaseModel):
    business_type: str
    records:       List[Dict[str, Any]]


# ── Health ───────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:  str
    service: str
    version: str
