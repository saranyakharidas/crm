from datetime import datetime
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.automation import Workflow, WorkflowExecution, AssignmentRule
from app.models.user import User
from app.schemas.automation import (
    WorkflowCreate, WorkflowResponse, WorkflowUpdate,
    AssignmentRuleCreate, AssignmentRuleResponse, AssignmentRuleUpdate
)

router = APIRouter(prefix="/workflows", tags=["automation"])

@router.get("", response_model=List[WorkflowResponse])
def get_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.scalars(
        select(Workflow)
        .where(Workflow.owner_id == current_user.id)
        .order_by(Workflow.created_at.desc())
    ).all()

@router.post("", response_model=WorkflowResponse)
def create_workflow(
    workflow_in: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    workflow = Workflow(
        **workflow_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow

@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: str,
    workflow_in: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    workflow = db.get(Workflow, workflow_id)
    if not workflow or workflow.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    update_data = workflow_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)
    
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    workflow = db.get(Workflow, workflow_id)
    if not workflow or workflow.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    return None

@router.post("/{workflow_id}/execute")
def execute_workflow(
    workflow_id: str,
    record_id: str,
    record_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Manual trigger/test of a workflow."""
    workflow = db.get(Workflow, workflow_id)
    if not workflow or workflow.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Create execution log
    execution = WorkflowExecution(
        workflow_id=workflow_id,
        status="success", # In a real system, this would follow logic
        summary="Manual execution triggered",
        record_id=record_id,
        record_name=record_name,
    )
    
    workflow.execution_count += 1
    workflow.last_executed_at = datetime.utcnow()
    
    db.add(execution)
    db.add(workflow)
    db.commit()
    return {"status": "ok", "execution_id": execution.id}

# --- Assignment Rules ---

@router.get("/rules", response_model=List[AssignmentRuleResponse])
def get_assignment_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.scalars(
        select(AssignmentRule)
        .where(AssignmentRule.owner_id == current_user.id)
        .order_by(AssignmentRule.priority.asc())
    ).all()

@router.post("/rules", response_model=AssignmentRuleResponse)
def create_assignment_rule(
    rule_in: AssignmentRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    rule = AssignmentRule(
        **rule_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/rules/{rule_id}", response_model=AssignmentRuleResponse)
def update_assignment_rule(
    rule_id: str,
    rule_in: AssignmentRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    rule = db.get(AssignmentRule, rule_id)
    if not rule or rule.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    rule = db.get(AssignmentRule, rule_id)
    if not rule or rule.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    return None

@router.post("/rules/{rule_id}/simulate")
def simulate_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    rule = db.get(AssignmentRule, rule_id)
    if not rule or rule.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.run_count += 1
    rule.last_run_at = datetime.utcnow()
    db.add(rule)
    db.commit()
    return {"status": "ok"}
