"""Real Home Assistant fixtures (pytest-homeassistant-custom-component)."""

# import our custom_components before the plugin puts its own testing_config first on sys.path
import custom_components  # noqa: F401

pytest_plugins = "pytest_homeassistant_custom_component"
