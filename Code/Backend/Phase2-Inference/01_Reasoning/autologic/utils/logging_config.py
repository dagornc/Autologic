# autologic/utils/logging_config.py
"""
Configuration centralisée du logging pour AutoLogic.
Remplace tous les print() par un système de logging robuste.
"""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logging(
    log_level: str = "INFO", log_file: Optional[str] = None, app_name: str = "autologic"
) -> logging.Logger:
    """
    Configure le système de logging pour l'application.

    Args:
        log_level: Niveau de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Chemin vers le fichier de log (optionnel)
        app_name: Nom du logger

    Returns:
        Logger configuré
    """
    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Éviter les handlers dupliqués
    if logger.handlers:
        return logger

    # Format détaillé pour le fichier, concis pour la console
    file_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_formatter = logging.Formatter("%(levelname)-8s | %(message)s")

    # Handler console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Handler fichier si spécifié
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_path, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger


def get_logger(name: str = "autologic") -> logging.Logger:
    """
    Récupère un logger existant ou en crée un nouveau.

    Args:
        name: Nom du logger (généralement __name__)

    Returns:
        Logger configuré
    """
    return logging.getLogger(name)


# Logger par défaut pour le module
logger = get_logger()
