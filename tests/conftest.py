"""tests/ uses Home Assistant stubs; tests/ha runs against a real Home Assistant.

The two cannot share one pytest run (the stubs replace the homeassistant modules), so the
real-HA tests only run with WEEKMENU_HA=1:  WEEKMENU_HA=1 pytest tests/ha
"""
import os

collect_ignore = [] if os.environ.get("WEEKMENU_HA") else ["ha"]
