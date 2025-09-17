"""
Structured logging configuration for the application
"""
import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict
from core.config import settings


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs logs in structured JSON format
    """

    def format(self, record: logging.LogRecord) -> str:
        # Create structured log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # In development, return pretty-printed JSON for readability
        if getattr(settings, 'DEBUG', False):
            return json.dumps(log_entry, indent=2, default=str)
        else:
            return json.dumps(log_entry, default=str)


def setup_logging() -> None:
    """
    Configure application logging with structured format
    """
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    # Create formatter
    formatter = StructuredFormatter()
    console_handler.setFormatter(formatter)

    # Add handler to logger
    logger.addHandler(console_handler)

    # Set specific loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


class StructuredLogger:
    """
    Wrapper class for structured logging with context
    """

    def __init__(self, name: str):
        self.logger = get_logger(name)

    def _log_with_context(self, level: int, message: str, **context: Any) -> None:
        """
        Log a message with additional context fields
        """
        extra = {"extra_fields": context} if context else {}
        self.logger.log(level, message, extra=extra)

    def debug(self, message: str, **context: Any) -> None:
        self._log_with_context(logging.DEBUG, message, **context)

    def info(self, message: str, **context: Any) -> None:
        self._log_with_context(logging.INFO, message, **context)

    def warning(self, message: str, **context: Any) -> None:
        self._log_with_context(logging.WARNING, message, **context)

    def error(self, message: str, **context: Any) -> None:
        self._log_with_context(logging.ERROR, message, **context)

    def critical(self, message: str, **context: Any) -> None:
        self._log_with_context(logging.CRITICAL, message, **context)

    def exception(self, message: str, **context: Any) -> None:
        """Log an exception with traceback"""
        self.logger.exception(message, extra={"extra_fields": context} if context else {})