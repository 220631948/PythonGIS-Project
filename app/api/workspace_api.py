"""
Project Workspace & Scenarios API

Provides endpoints for:
- Save multiple analysis scenarios
- Project folders with organized layers
- Team workspace sharing
- Version control for spatial edits
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import uuid

router = APIRouter(prefix="/workspace", tags=["Project Workspace"])
logger = logging.getLogger(__name__)

workspaces_db = []
scenarios_db = []


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: str
    team_members: Optional[List[str]] = []
    is_public: bool = False


class ScenarioCreate(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    layers: List[str]
    map_state: Dict[str, Any]
    analysis_results: Optional[Dict[str, Any]] = None


@router.post("/workspaces")
async def create_workspace(workspace: WorkspaceCreate):
    """Create a new project workspace."""
    try:
        workspace_entry = {
            "id": str(uuid.uuid4()),
            "name": workspace.name,
            "description": workspace.description,
            "owner_id": workspace.owner_id,
            "team_members": workspace.team_members or [],
            "is_public": workspace.is_public,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "scenarios": [],
            "folders": []
        }
        workspaces_db.append(workspace_entry)

        return {
            "success": True,
            "workspace_id": workspace_entry["id"],
            "message": "Workspace created successfully"
        }
    except Exception as e:
        logger.error(f"Workspace creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workspaces/{user_id}")
async def get_user_workspaces(user_id: str):
    """Get workspaces accessible to a user."""
    try:
        accessible = [
            w for w in workspaces_db
            if w["owner_id"] == user_id or user_id in w["team_members"] or w["is_public"]
        ]
        return {"workspaces": accessible, "total": len(accessible)}
    except Exception as e:
        logger.error(f"Get workspaces error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scenarios")
async def create_scenario(scenario: ScenarioCreate):
    """Save an analysis scenario."""
    try:
        scenario_entry = {
            "id": str(uuid.uuid4()),
            "workspace_id": scenario.workspace_id,
            "name": scenario.name,
            "description": scenario.description,
            "layers": scenario.layers,
            "map_state": scenario.map_state,
            "analysis_results": scenario.analysis_results,
            "created_at": datetime.now().isoformat(),
            "version": 1
        }
        scenarios_db.append(scenario_entry)

        return {
            "success": True,
            "scenario_id": scenario_entry["id"],
            "message": "Scenario saved successfully"
        }
    except Exception as e:
        logger.error(f"Scenario creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios/{workspace_id}")
async def get_workspace_scenarios(workspace_id: str):
    """Get all scenarios in a workspace."""
    try:
        workspace_scenarios = [s for s in scenarios_db if s["workspace_id"] == workspace_id]
        return {"scenarios": workspace_scenarios, "total": len(workspace_scenarios)}
    except Exception as e:
        logger.error(f"Get scenarios error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
