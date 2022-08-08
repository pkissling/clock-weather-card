import { TextFieldBase } from '@material/mwc-textfield/mwc-textfield-base.js';
import { NotchedOutlineBase } from '@material/mwc-notched-outline/mwc-notched-outline-base.js';

import { styles as textfieldStyles } from '@material/mwc-textfield/mwc-textfield.css';
import { styles as notchedOutlineStyles } from '@material/mwc-notched-outline/mwc-notched-outline.css';

export const textfieldDefinition = {
  'mwc-textfield': class extends TextFieldBase {
    static get styles() {
      return textfieldStyles;
    }
  },
  'mwc-notched-outline': class extends NotchedOutlineBase {
    static get styles() {
      return notchedOutlineStyles;
    }
  },
};
