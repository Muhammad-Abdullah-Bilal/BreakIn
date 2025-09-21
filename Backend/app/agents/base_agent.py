"""Base Agent class for all AI agents in the BreakIn system."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class AgentConfig(BaseModel):
    """Configuration for AI agents."""
    name: str
    enabled: bool = True
    max_retries: int = 3
    timeout_seconds: int = 300
    rate_limit_per_minute: int = 60
    custom_settings: Dict[str, Any] = {}


class AgentResult(BaseModel):
    """Standard result format for agent operations."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: float
    timestamp: datetime
    agent_name: str
    metadata: Dict[str, Any] = {}


class BaseAgent(ABC):
    """Base class for all AI agents."""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.name = config.name
        self.logger = logging.getLogger(f"agent.{self.name}")
        self._execution_count = 0
        self._last_execution = None
        
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        """Execute the agent's main functionality."""
        pass
    
    @abstractmethod
    async def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data before execution."""
        pass
    
    async def health_check(self) -> bool:
        """Check if the agent is healthy and ready to execute."""
        return self.config.enabled
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            "name": self.name,
            "enabled": self.config.enabled,
            "execution_count": self._execution_count,
            "last_execution": self._last_execution,
            "config": self.config.dict()
        }
    
    async def _execute_with_retry(self, input_data: Dict[str, Any]) -> AgentResult:
        """Execute with retry logic."""
        start_time = datetime.utcnow()
        
        for attempt in range(self.config.max_retries):
            try:
                if not await self.validate_input(input_data):
                    return AgentResult(
                        success=False,
                        error="Input validation failed",
                        execution_time=0,
                        timestamp=start_time,
                        agent_name=self.name
                    )
                
                result = await self.execute(input_data)
                self._execution_count += 1
                self._last_execution = datetime.utcnow()
                
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                result.execution_time = execution_time
                
                return result
                
            except Exception as e:
                self.logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == self.config.max_retries - 1:
                    execution_time = (datetime.utcnow() - start_time).total_seconds()
                    return AgentResult(
                        success=False,
                        error=f"Failed after {self.config.max_retries} attempts: {str(e)}",
                        execution_time=execution_time,
                        timestamp=start_time,
                        agent_name=self.name
                    )
        
        # Should never reach here
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        return AgentResult(
            success=False,
            error="Unexpected execution path",
            execution_time=execution_time,
            timestamp=start_time,
            agent_name=self.name
        )