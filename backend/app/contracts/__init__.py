"""Typed task-contract parsing for Rule Zero Phase 2."""

from .models import TaskContract
from .parser import parse_task_contract

__all__ = ["TaskContract", "parse_task_contract"]
