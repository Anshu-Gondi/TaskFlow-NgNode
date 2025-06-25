# models.py (FastAPI service)

from pydantic import BaseModel, Field
from typing import List, Optional

class Task(BaseModel):
    id: Optional[str] = Field(alias="_id")
    title: str
    listId: str = Field(alias="_listId")
    completed: bool = False
    priority: int = 0
    dueDate: Optional[str] = None

    model_config = {
        "populate_by_name": True,    # accept both “id” and “_id” in input
        "alias_generator": None,     # leave underscore aliases intact
        "extra": "ignore"            # drop any unrecognized fields
    }

class TaskRequest(BaseModel):
    tasks: List[Task]

    model_config = {
        "populate_by_name": True
    }
