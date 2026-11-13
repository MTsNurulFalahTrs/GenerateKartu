'use client';

import Swal from 'sweetalert2';
import type { SweetAlertIcon } from 'sweetalert2';

const duration = 2000;
const visible: HTMLElement[] = [];
let stack: HTMLElement | undefined;

function remove(node: HTMLElement) {
  const index = visible.indexOf(node);
  if (index === -1) return;
  visible.splice(index, 1);
  node.remove();
  if (!visible.length && stack?.hasAttribute('popover') && stack.matches(':popover-open')) stack.hidePopover();
}

export function notify(icon: SweetAlertIcon, message: string) {
  if (!message) return;
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'app-toast-stack';
    if (typeof stack.showPopover === 'function') stack.setAttribute('popover', 'manual');
    else stack.classList.add('app-toast-fallback');
    stack.setAttribute('aria-label', 'Notifikasi');
    document.body.append(stack);
  }
  const target = document.createElement('div');
  stack.append(target);
  // SweetAlert2 has one live popup. Retain its rendered toast in the stack
  // and manage each toast's expiry independently.
  void Swal.fire({
    target, toast: true, icon, text: message, showConfirmButton: false,
    animation: false,
    hideClass: { popup: '', backdrop: '', icon: '' },
    returnFocus: false,
  });
  const popup = Swal.getPopup()?.cloneNode(true) as HTMLElement | undefined;
  Swal.close();
  target.remove();
  if (!popup) return;
  popup.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  popup.removeAttribute('aria-labelledby');
  popup.removeAttribute('aria-describedby');
  popup.setAttribute('role', icon === 'error' || icon === 'warning' ? 'alert' : 'status');
  popup.setAttribute('aria-label', message);
  popup.classList.add('app-toast');
  if (visible.length === 3) remove(visible[0]);
  visible.push(popup);
  stack.append(popup);
  if (stack.hasAttribute('popover')) {
    if (stack.matches(':popover-open')) stack.hidePopover();
    stack.showPopover();
  }
  window.setTimeout(() => remove(popup), duration);
}
