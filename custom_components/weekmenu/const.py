"""Constants for Weekmenu."""

DOMAIN = "weekmenu"
STORAGE_KEY = "weekmenu"
STORAGE_VERSION = 1
STORAGE_MINOR_VERSION = 2

PANEL_URL = "weekmenu"
STATIC_URL = "/weekmenu_static"

SOURCES = ("standard", "promo", "recipe", "extra", "michelle", "advice", "snack")

PICNIC_DOMAIN = "picnic"

CONF_FIRE_URL = "claude_fire_url"
CONF_TOKEN = "claude_token"
PENDING_MINUTES = 20

# plan status
STATUS_NONE = "none"
STATUS_PROPOSED = "proposed"
STATUS_APPROVING = "approving"
STATUS_APPROVED = "approved"

# finished cooking timers stay visible ("klaar!") this long
TIMER_KEEP_SECONDS = 15 * 60

# HA user group that may only read
READ_ONLY_GROUP = "system-read-only"
