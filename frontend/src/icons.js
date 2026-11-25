import { svg } from "lit";
import {
  mdiAlertCircleOutline, mdiArrowLeft, mdiArrowRight, mdiBasketOutline, mdiCalendarWeekOutline, mdiCartArrowDown,
  mdiCartOutline, mdiCheck, mdiChefHat, mdiChevronRight, mdiClose, mdiCurrencyEur, mdiDeleteOutline,
  mdiFoodForkDrink, mdiLightbulbOutline, mdiLinkVariant, mdiLoading, mdiMagnify, mdiMenu, mdiMinus, mdiPlus,
  mdiPotSteamOutline, mdiRefresh, mdiSilverwareForkKnife, mdiThumbDownOutline, mdiThumbUpOutline, mdiTimerOutline,
  mdiTruckDeliveryOutline, mdiUndo, mdiInformationOutline, mdiCancel, mdiClockOutline,
} from "@mdi/js";

export const I = {
  alert: mdiAlertCircleOutline, back: mdiArrowLeft, next: mdiArrowRight, basket: mdiBasketOutline,
  week: mdiCalendarWeekOutline, toCart: mdiCartArrowDown, cart: mdiCartOutline, check: mdiCheck, cook: mdiChefHat,
  chevron: mdiChevronRight, close: mdiClose, euro: mdiCurrencyEur, trash: mdiDeleteOutline, dish: mdiFoodForkDrink,
  tip: mdiLightbulbOutline, link: mdiLinkVariant, loading: mdiLoading, search: mdiMagnify, menu: mdiMenu, minus: mdiMinus,
  plus: mdiPlus, pot: mdiPotSteamOutline, refresh: mdiRefresh, cutlery: mdiSilverwareForkKnife, down: mdiThumbDownOutline,
  up: mdiThumbUpOutline, timer: mdiTimerOutline, truck: mdiTruckDeliveryOutline, undo: mdiUndo, info: mdiInformationOutline,
  none: mdiCancel, clock: mdiClockOutline,
};

/** Inline mdi icon; decorative unless a label is given. */
export const icon = (path, cls = "", label = "") =>
  svg`<svg class="i ${cls}" viewBox="0 0 24 24" role=${label ? "img" : "presentation"} aria-hidden=${label ? "false" : "true"} aria-label=${label || ""}><path d=${path}></path></svg>`;
