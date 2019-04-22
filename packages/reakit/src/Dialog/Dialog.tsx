import * as React from "react";
import { warning } from "../__utils/warning";
import { Keys } from "../__utils/types";
import { unstable_createComponent } from "../utils/createComponent";
import { unstable_useCreateElement } from "../utils/useCreateElement";
import { mergeProps } from "../utils/mergeProps";
import { unstable_useOptions } from "../system/useOptions";
import { unstable_useProps } from "../system/useProps";
import { Portal } from "../Portal/Portal";
import { HiddenOptions, HiddenProps, useHidden } from "../Hidden/Hidden";
import { useDisclosureRef } from "./__utils/useDisclosureRef";
import { usePreventBodyScroll } from "./__utils/usePreventBodyScroll";
import { useFocusOnShow } from "./__utils/useFocusOnShow";
import { usePortalRef } from "./__utils/usePortalRef";
import { useFocusTrap } from "./__utils/useFocusTrap";
import { useFocusOnHide } from "./__utils/useFocusOnHide";
import { useNestedDialogs } from "./__utils/useNestedDialogs";
import { useHideOnClickOutside } from "./__utils/useHideOnClickOutside";
import { useHideOnFocusOutside } from "./__utils/useHideOnFocusOutside";
import { useDialogState, DialogStateReturn } from "./DialogState";
import { useDisableHoverOutside } from "./__utils/useDisableHoverOutside";

export type DialogOptions = HiddenOptions &
  Pick<Partial<DialogStateReturn>, "hide"> &
  Pick<DialogStateReturn, "unstable_hiddenId"> & {
    /**
     * Toggles Dialog's `modal` state.
     *  - Non-modal: `preventBodyScroll` doesn't work and focus is free.
     *  - Modal: `preventBodyScroll` is automatically enabled, focus is
     * trapped within the dialog and the dialog is rendered within a `Portal`
     * by default.
     */
    modal?: boolean;
    /**
     * When enabled, user can hide the dialog by pressing `Escape`.
     */
    hideOnEsc?: boolean;
    /**
     * When enabled, user can hide the dialog by clicking outside it.
     */
    hideOnClickOutside?: boolean;
    /**
     * When enabled, user can't scroll on body when the dialog is visible.
     * This option doesn't work if the dialog isn't modal.
     */
    preventBodyScroll?: boolean;
    /**
     * The element that will be focused when the dialog shows.
     * When not set, the first tabbable element within the dialog will be used.
     * `autoFocusOnShow` disables it.
     */
    unstable_initialFocusRef?: React.RefObject<HTMLElement>;
    /**
     * The element that will be focused when the dialog hides.
     * When not set, the disclosure component will be used.
     * `autoFocusOnHide` disables it.
     */
    unstable_finalFocusRef?: React.RefObject<HTMLElement>;
    /**
     * Whether or not the dialog should be rendered within `Portal`.
     * It's `true` by default if `modal` is `true`.
     */
    unstable_portal?: boolean;
    /**
     * Whether or not to move focus when the dialog shows.
     * @private
     */
    unstable_autoFocusOnShow?: boolean;
    /**
     * Whether or not to move focus when the dialog hides.
     * @private
     */
    unstable_autoFocusOnHide?: boolean;
  };

export type DialogProps = HiddenProps;

export function useDialog(
  {
    modal = true,
    hideOnEsc = true,
    hideOnClickOutside = true,
    preventBodyScroll = true,
    unstable_autoFocusOnShow = true,
    unstable_autoFocusOnHide = true,
    unstable_portal: isPortal = modal,
    ...options
  }: DialogOptions,
  htmlProps: DialogProps = {}
) {
  let _options: DialogOptions = {
    modal,
    hideOnEsc,
    hideOnClickOutside,
    preventBodyScroll,
    unstable_autoFocusOnShow,
    unstable_autoFocusOnHide,
    unstable_portal: isPortal,
    ...options
  };
  _options = unstable_useOptions("Dialog", _options, htmlProps);

  const dialog = React.useRef<HTMLElement>(null);
  const portal = usePortalRef(dialog, _options);
  const disclosure = useDisclosureRef(_options);
  const { dialogs, wrap } = useNestedDialogs(dialog, _options);

  usePreventBodyScroll(dialog, _options);
  useFocusTrap(dialog, portal, _options);
  useFocusOnShow(dialog, dialogs, _options);
  useFocusOnHide(dialog, disclosure, _options);
  useHideOnClickOutside(portal, disclosure, dialogs, _options);
  useHideOnFocusOutside(dialog, disclosure, dialogs, _options);
  useDisableHoverOutside(dialog, dialogs, _options);

  htmlProps = mergeProps(
    {
      ref: dialog,
      role: "dialog",
      tabIndex: -1,
      "aria-modal": _options.modal,
      "data-dialog": true,
      style: { zIndex: 999 },
      onKeyDown: event => {
        if (event.key === "Escape" && _options.hide && _options.hideOnEsc) {
          event.stopPropagation();
          _options.hide();
        }
      },
      unstable_wrap: children =>
        _options.unstable_portal ? (
          <Portal>{wrap(children)}</Portal>
        ) : (
          wrap(children)
        )
    } as DialogProps,
    // If it's not modal, it doesn't have a portal
    // So we define dialog itself as portal
    !_options.modal && {
      className: Portal.__className
    },
    htmlProps
  );

  htmlProps = unstable_useProps("Dialog", _options, htmlProps);
  htmlProps = useHidden(_options, htmlProps);
  return htmlProps;
}

const keys: Keys<DialogStateReturn & DialogOptions> = [
  ...useHidden.__keys,
  ...useDialogState.__keys,
  "modal",
  "hideOnEsc",
  "hideOnClickOutside",
  "preventBodyScroll",
  "unstable_initialFocusRef",
  "unstable_finalFocusRef",
  "unstable_autoFocusOnShow",
  "unstable_autoFocusOnHide",
  "unstable_portal"
];

useDialog.__keys = keys;

export const Dialog = unstable_createComponent({
  as: "div",
  useHook: useDialog,
  useCreateElement: (type, props, children) => {
    warning(
      !props["aria-label"] && !props["aria-labelledby"],
      `You should provide either \`aria-label\` or \`aria-labelledby\` props.
See https://www.w3.org/TR/wai-aria-practices-1.1/#dialog_roles_states_props`,
      "Dialog"
    );
    return unstable_useCreateElement(type, props, children);
  }
});