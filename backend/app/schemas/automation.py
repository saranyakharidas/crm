from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.automation import WorkflowStatus, WorkflowModule

class WorkflowExecutionSchema(BaseModel):
    id: str
    workflow_id: str
    status: str
    summary: str
    record_id: str
    record_name: str
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WorkflowBase(BaseModel):
    name: str
    description: str = ""
    status: WorkflowStatus = WorkflowStatus.draft
    module: WorkflowModule
    trigger: Dict[str, Any]
    conditions: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    trigger: Optional[Dict[str, Any]] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None

class WorkflowResponse(WorkflowBase):
    id: str
    execution_count: int
    last_executed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    executions: List[WorkflowExecutionSchema] = []

    model_config = ConfigDict(from_attributes=True)

class AssignmentRuleBase(BaseModel):
    name: str
    description: str = ""
    status: WorkflowStatus = WorkflowStatus.draft
    priority: int = 0
    match_all: bool = True
    conditions: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []

class AssignmentRuleCreate(AssignmentRuleBase):
    pass

class AssignmentRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    priority: Optional[int] = None
    match_all: Optional[bool] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None

class AssignmentRuleResponse(AssignmentRuleBase):
    id: str
    run_count: int
    last_run_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
