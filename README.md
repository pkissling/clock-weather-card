# Vue 3 Home Assistant Lovelace Custom Component AND Connector
Starter Project - create custom cards for HA with Vue!!

## For display of existing Home Assistant cards within a Vue custom component, check the 'dev' branch

### IMPORTANT NOTES:
   * development is separated from HA server and vue cli is not required to be installed on HA server
   * `/local/` is `/config/www/` directory in HA
   * `/config/www/` is exposed to lovelace dashboard, it's starting point on HA server
   * Idea is to use HTMLElement to get access to its setConfig method (lovelace requirement)
        - this retrieves config from lovelace card yaml
        - HTMLElement is othervise dumb and serves only as a wrapper for vue component that passes config
        - whole state management and comunication can be done in vue component
        - pass whole `hass` object and utilize its functionality: call service, API or WebSocket - [HomeAssistant interface](https://github.com/home-assistant/frontend/blob/dev/src/types.ts)
   * In case you want to use hacs.json and to be able to add **your new repository to HACS** as custom repo
        - hacs.json is already added to this repo
        - before commiting and pushing changes to git, run `npm run build`
        - after code is pushed to git, create release and add new tag
        - go in HACS and add your repo, or redownload new version

#### Clone project:
```
   git clone https://github.com/iva-stolnik/vue-ha-lovelace-connector
   npm install
   npm run dev
```

Build vue custom component:
```
   npm run watch
   // or
   npm run build
```
### Home Aassistant setup:
   * If using via HACS skip this part
   * In HA /config/www/ create file vue-custom-card.js // or any other name
      * here copy paste build output from `main_prod.js` after you run `npm run build`

### Dashboard setup:
   * if using via HACS skip this part also
   * open dashboards -> 3 dots in right corner -> resources -> ADD RESOURCES
   * setup path for new component: 
```
   /local/vue-custom-card.js // for Vue component
```
   * setup resource type to JS module
   * on your dashboard create new card -> show code editor -> paste following:
   ```
type: custom:vue-custom-card
someProp: You did it legend :)
entity_id: your_light_entity
   ```
   * save card -> exit dashboard editor

## THATS IT!
