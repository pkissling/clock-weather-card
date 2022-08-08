import { SwitchBase } from '@material/mwc-switch/deprecated/mwc-switch-base.js';
import { RippleBase } from '@material/mwc-ripple/mwc-ripple-base.js';
import { styles as switchStyles } from '@material/mwc-switch/deprecated/mwc-switch.css';
import { styles as rippleStyles } from '@material/mwc-ripple/mwc-ripple.css';

export const switchDefinition = {
  'mwc-switch': class extends SwitchBase {
    static get styles() {
      return switchStyles;
    }
  },
  'mwc-ripple': class extends RippleBase {
    static get styles() {
      return rippleStyles;
    }
  },
};
