"""
Central application configuration.

All secrets and environment-specific values are loaded from environment
variables (see .env.example). Nothing sensitive is ever hardcoded here.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly typed application settings, populated from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    app_name: str = "Boardroom AI"
    environment: str = Field(default="development")  # development | staging | production
    debug: bool = Field(default=True)
    log_level: str = Field(default="INFO")

    # --- Gemini / Google ADK ---
    google_api_key: str = Field(default="", description="Gemini API key (Google AI Studio)")
    google_genai_use_vertexai: bool = Field(default=False)
    gemini_model_pro: str = Field(
        default="gemini-2.5-flash",
        description="Model for the CEO synthesis step. NOTE: free-tier Gemini API "
        "keys currently have a 0 request/day quota for gemini-2.5-pro -- only "
        "change this to a 'pro' model if your key has billing enabled.",
    )
    gemini_model_flash: str = Field(default="gemini-3.8-flash")

    # --- CORS ---
    allowed_origins: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # --- MCP Servers ---
    mcp_web_search_enabled: bool = Field(default=True)
    mcp_filesystem_enabled: bool = Field(default=True)
    mcp_github_enabled: bool = Field(default=False)

    github_token: str = Field(default="", description="Used only by GitHub MCP server")
    mcp_filesystem_root: str = Field(
        default_factory=lambda: os.path.join(os.getcwd(), "board_sessions")
    )

    # --- Security ---
    max_idea_length: int = Field(default=2000)
    min_idea_length: int = Field(default=10)
    request_timeout_seconds: int = Field(default=90)
    agent_timeout_seconds: int = Field(default=45)

    # --- Rate limiting ---
    rate_limit_per_minute: int = Field(default=10)


@lru_cache
def get_settings() -> Settings:
    """Returns a cached Settings instance (loaded once per process)."""
    return Settings()
