# Changelog

## [3.0.0](https://github.com/pkissling/clock-weather-card/compare/v2.9.6...v3.0.0) (2026-10-25)


### ⚠ BREAKING CHANGES

* most v2 options moved under sections.header, sections.forecast_strip or sections.forecast_list, or are replaced by header segments; time_format and use_browser_time are removed.

### Features

* add a `temperature_sensor` option for the current temperature ([#741](https://github.com/pkissling/clock-weather-card/issues/741)) ([efd8a9a](https://github.com/pkissling/clock-weather-card/commit/efd8a9a89e5f4196c31dba71821d19bb100aa991))
* add a global round_temperatures option, overridable per section ([#802](https://github.com/pkissling/clock-weather-card/issues/802)) ([8b8c5ee](https://github.com/pkissling/clock-weather-card/commit/8b8c5ee678efec0566db8aa59831b1e231aae4e9))
* always show the attribute row when any column has a value ([#773](https://github.com/pkissling/clock-weather-card/issues/773)) ([582df53](https://github.com/pkissling/clock-weather-card/commit/582df539ffcb05bf9d14222f4883c5a06db3ef7b))
* **editor:** always show row alignment and font size ([#767](https://github.com/pkissling/clock-weather-card/issues/767)) ([abe7adb](https://github.com/pkissling/clock-weather-card/commit/abe7adb94d4798d9e5177f5aaf8403713a67f6e3))
* **editor:** pick colors with the native color picker ([#772](https://github.com/pkissling/clock-weather-card/issues/772)) ([cb7ffe5](https://github.com/pkissling/clock-weather-card/commit/cb7ffe5c2fb6bfddc6d75547a3e4dba59bb7288e))
* follow the user's profile time zone setting ([#751](https://github.com/pkissling/clock-weather-card/issues/751)) ([d5461b1](https://github.com/pkissling/clock-weather-card/commit/d5461b12bf4e2ee7ea7faee4450858245ed1f5f2))
* **forecast:** hide zero precipitation in the strip and add hide_attribute ([#799](https://github.com/pkissling/clock-weather-card/issues/799)) ([2be9b30](https://github.com/pkissling/clock-weather-card/commit/2be9b3052d6c65ab45556dfa727412c9c2578010))
* **forecast:** spread forecast strip columns across the full width ([#777](https://github.com/pkissling/clock-weather-card/issues/777)) ([0836abe](https://github.com/pkissling/clock-weather-card/commit/0836abe83c13f45acaa248a4011cb1669a1861cd))
* **forecast:** tint the bar track with the theme's secondary text color ([#768](https://github.com/pkissling/clock-weather-card/issues/768)) ([e26631b](https://github.com/pkissling/clock-weather-card/commit/e26631b971ed2c3ee69ae49583fd4fd447e01d60))
* format numbers per the Home Assistant number format setting ([#752](https://github.com/pkissling/clock-weather-card/issues/752)) ([572f0f8](https://github.com/pkissling/clock-weather-card/commit/572f0f830771ccfa3bfe3e58b670ec4235e163de))
* **header:** add a gap between header rows ([#780](https://github.com/pkissling/clock-weather-card/issues/780)) ([f865038](https://github.com/pkissling/clock-weather-card/commit/f8650385676ea10434088362297ba8fb875976c7))
* **header:** add a template segment ([#781](https://github.com/pkissling/clock-weather-card/issues/781)) ([8cf541b](https://github.com/pkissling/clock-weather-card/commit/8cf541b0768b2a9df402a5b2c76f4b2f80544b57))
* move temperature_sensor to additional_sensors.temperature ([#797](https://github.com/pkissling/clock-weather-card/issues/797)) ([eb23f40](https://github.com/pkissling/clock-weather-card/commit/eb23f40162685c79ff70ec220afef8700c3d1936))
* report the card size to masonry and sections views ([#769](https://github.com/pkissling/clock-weather-card/issues/769)) ([3b513c3](https://github.com/pkissling/clock-weather-card/commit/3b513c31c2548f822c16a79afc0a3a7ac8abbe12))
* respect the display precision of sensors ([#758](https://github.com/pkissling/clock-weather-card/issues/758)) ([f22348b](https://github.com/pkissling/clock-weather-card/commit/f22348b1b3ae9348f9e1fecde384beb682537b47))
* rewrite clock-weather-card ([42094b8](https://github.com/pkissling/clock-weather-card/commit/42094b890622662dd1e5ddb44677800811f2e9e3))


### Bug Fixes

* **a11y:** activate the clickable card with Space as well as Enter ([#789](https://github.com/pkissling/clock-weather-card/issues/789)) ([a3fcc85](https://github.com/pkissling/clock-weather-card/commit/a3fcc852248ab251f8a927ab14f8db08d79b9268))
* **a11y:** describe weather icons with their translated condition ([#790](https://github.com/pkissling/clock-weather-card/issues/790)) ([c8456e2](https://github.com/pkissling/clock-weather-card/commit/c8456e21f902f60c5d5b66f4964bc175624f9e11))
* **clock:** realign the clock tick after the device sleeps ([#793](https://github.com/pkissling/clock-weather-card/issues/793)) ([9340adc](https://github.com/pkissling/clock-weather-card/commit/9340adc9663b11ea7d6345f32f2fc27a1fb34198))
* **config:** reject header rows without segments instead of crashing ([#786](https://github.com/pkissling/clock-weather-card/issues/786)) ([b4297f6](https://github.com/pkissling/clock-weather-card/commit/b4297f6a607ee890e932a127aedce621ce67d919))
* **config:** skip attribute checks while a segment's entity is unavailable ([608affd](https://github.com/pkissling/clock-weather-card/commit/608affd57772c058937f21730b4c893d4ee26ad7))
* correct the typo in the card picker description ([#791](https://github.com/pkissling/clock-weather-card/issues/791)) ([14c1814](https://github.com/pkissling/clock-weather-card/commit/14c18143671e785147f815b61900eef3d1f6d1d7))
* **docs:** revert Noctis preview theme to 3.3.5 and ignore the mistagged 3.32 tag ([58d4045](https://github.com/pkissling/clock-weather-card/commit/58d40459b19a26aa71a4e0cb7cecabea09dff4ee))
* **e2e:** remove the HA container when a run is terminated ([#798](https://github.com/pkissling/clock-weather-card/issues/798)) ([96b947f](https://github.com/pkissling/clock-weather-card/commit/96b947fd7a9e2ed4853d8bec3190ffb8a013db6a))
* follow the 12/24-hour time format of the Home Assistant profile ([#747](https://github.com/pkissling/clock-weather-card/issues/747)) ([4f9d5d9](https://github.com/pkissling/clock-weather-card/commit/4f9d5d9822fc089a3526db4203735d0da7ba260a))
* **forecast:** detect night correctly when sunset falls after midnight ([#792](https://github.com/pkissling/clock-weather-card/issues/792)) ([4cb9e8d](https://github.com/pkissling/clock-weather-card/commit/4cb9e8d03c8e668756ffe5145c9ffb86931d7f68))
* **forecast:** follow the live sun state for the hourly "Now" icon ([#765](https://github.com/pkissling/clock-weather-card/issues/765)) ([a8d6446](https://github.com/pkissling/clock-weather-card/commit/a8d6446146bf0fa18a7b4459fcf464a8c73c992d))
* **forecast:** render forecast entries with missing temperature or condition ([#785](https://github.com/pkissling/clock-weather-card/issues/785)) ([f01da36](https://github.com/pkissling/clock-weather-card/commit/f01da36e87fea552470eca2f98c95a60f310db48))
* **forecast:** resubscribe to forecasts after a WebSocket reconnect ([efcbdf2](https://github.com/pkissling/clock-weather-card/commit/efcbdf2d48676a16620ded1d36b225d5e3bb128f))
* **forecast:** size the strip skeleton like the loaded strip ([#801](https://github.com/pkissling/clock-weather-card/issues/801)) ([e140000](https://github.com/pkissling/clock-weather-card/commit/e140000a8a278289481c1e96779fd9445c3831b5))
* **header:** ignore unit when `show_unit` is false instead of erroring ([#740](https://github.com/pkissling/clock-weather-card/issues/740)) ([6f0ec4c](https://github.com/pkissling/clock-weather-card/commit/6f0ec4c5d916e62282c5de369dfe803e997bcc58))
* **header:** separate letter units from the value with a space ([2d2a65d](https://github.com/pkissling/clock-weather-card/commit/2d2a65dc38e223f0c9d5fda5717e0dc14451b71b))
* **header:** stop header segments from clipping descenders ([#776](https://github.com/pkissling/clock-weather-card/issues/776)) ([8ff3b58](https://github.com/pkissling/clock-weather-card/commit/8ff3b5881cad6520273c651477e1c72678e0268d))
* keep the last valid config for child components when the config turns invalid ([#796](https://github.com/pkissling/clock-weather-card/issues/796)) ([bbfab82](https://github.com/pkissling/clock-weather-card/commit/bbfab82ba83c4d551e11f0fcc4c70ea12e18f155))
* re-render when the temperature sensor changes ([#744](https://github.com/pkissling/clock-weather-card/issues/744)) ([05f7af1](https://github.com/pkissling/clock-weather-card/commit/05f7af17da48e3a96e4e7f7b873832a79464802a))
* recover after temporary weather entity absence ([#732](https://github.com/pkissling/clock-weather-card/issues/732)) ([488a7a1](https://github.com/pkissling/clock-weather-card/commit/488a7a1fe9cf5349f00ad356a29b82265c6e029e))
* render an empty card instead of hard-coded text while the card loads ([8a2496a](https://github.com/pkissling/clock-weather-card/commit/8a2496aa96776b499e12f078f1aa90758a007043))
* show clear sky as 'Sunny' by day and 'Clear' at night ([#734](https://github.com/pkissling/clock-weather-card/issues/734)) ([349051b](https://github.com/pkissling/clock-weather-card/commit/349051b2ab20d45af245db74b13e240136f54429))
* show values that round to zero without a minus sign ([#788](https://github.com/pkissling/clock-weather-card/issues/788)) ([c1f8d1e](https://github.com/pkissling/clock-weather-card/commit/c1f8d1ee2b310b2419fbc27aeceb672a6d99fc1a))
* tolerate the card bundle being loaded twice ([#733](https://github.com/pkissling/clock-weather-card/issues/733)) ([ed32d5c](https://github.com/pkissling/clock-weather-card/commit/ed32d5c8fc88e2368f013e83abf44da7a991ddf4))


### Performance Improvements

* skip config resolution on hass updates the card does not read ([fcabbe8](https://github.com/pkissling/clock-weather-card/commit/fcabbe83a87ab4630199811325a7311ac31af1fa))
* skip forecast re-renders on unrelated hass updates ([#742](https://github.com/pkissling/clock-weather-card/issues/742)) ([c4ce9c0](https://github.com/pkissling/clock-weather-card/commit/c4ce9c06df811633dbba67d9782985008c9cd2e5))

## [2.9.6](https://github.com/pkissling/clock-weather-card/compare/v2.9.5...v2.9.6) (2026-10-03)


### Bug Fixes

* Match the full forecast period for the current temperature ([#724](https://github.com/pkissling/clock-weather-card/issues/724)) ([3fbdac1](https://github.com/pkissling/clock-weather-card/commit/3fbdac14e9d50a0d8296bbad2a95b92091ce7215))

## [2.9.5](https://github.com/pkissling/clock-weather-card/compare/v2.9.4...v2.9.5) (2026-09-23)


### Bug Fixes

* clear clock interval when the card is disconnected ([#721](https://github.com/pkissling/clock-weather-card/issues/721)) ([e61027f](https://github.com/pkissling/clock-weather-card/commit/e61027f907f6b02ae8fb79858ffce9a7c369ac5f))

## [2.9.4](https://github.com/pkissling/clock-weather-card/compare/v2.9.3...v2.9.4) (2026-07-15)


### Bug Fixes

* Add Japanese translation ([#706](https://github.com/pkissling/clock-weather-card/issues/706)) ([023f4bd](https://github.com/pkissling/clock-weather-card/commit/023f4bd2a9a3f3bc16001d28dfb0111c23f97862))

## [2.9.3](https://github.com/pkissling/clock-weather-card/compare/v2.9.2...v2.9.3) (2026-04-09)


### Bug Fixes

* **deps:** update dependency custom-card-helpers to v2 ([#663](https://github.com/pkissling/clock-weather-card/issues/663)) ([de52a84](https://github.com/pkissling/clock-weather-card/commit/de52a847d8d170a676103f7c82838c7543b2fd5e))
* Hourly forecast dot sometimes not rendering ([#668](https://github.com/pkissling/clock-weather-card/issues/668)) ([e53730d](https://github.com/pkissling/clock-weather-card/commit/e53730d805e8cdfa218f020af031ca547805e347))
* Update Danish translations for weather terms ([#675](https://github.com/pkissling/clock-weather-card/issues/675)) ([b21353a](https://github.com/pkissling/clock-weather-card/commit/b21353a42a4a38aa208385ced757b16b64379f04))

## [2.9.2](https://github.com/pkissling/clock-weather-card/compare/v2.9.1...v2.9.2) (2025-12-23)


### Bug Fixes

* Update German translations ([#644](https://github.com/pkissling/clock-weather-card/issues/644)) ([59a4977](https://github.com/pkissling/clock-weather-card/commit/59a49775248b1a768ecede80f97af6a3abc4b957))

## [2.9.1](https://github.com/pkissling/clock-weather-card/compare/v2.9.0...v2.9.1) (2025-09-10)


### Bug Fixes

* **deps:** update minor-dependencies ([#612](https://github.com/pkissling/clock-weather-card/issues/612)) ([3a90a56](https://github.com/pkissling/clock-weather-card/commit/3a90a568cd8cdbea3101a1ec35c39c99d7efaf56))
* fix temperature bar gradient banding ([#605](https://github.com/pkissling/clock-weather-card/issues/605)) ([0417491](https://github.com/pkissling/clock-weather-card/commit/04174911ae08e87e0b61604a386d63241c6a0bb8))
* Improve AQI Text Readability on Light Backgrounds ([#602](https://github.com/pkissling/clock-weather-card/issues/602)) ([7ec081f](https://github.com/pkissling/clock-weather-card/commit/7ec081f1c21f9dd76e71574494233c559bbb5a71))
* missing diacritics in romanian translation ([#597](https://github.com/pkissling/clock-weather-card/issues/597)) ([320a376](https://github.com/pkissling/clock-weather-card/commit/320a3760f0f37a4142905807e0c6574d8733725a))

## [2.9.0](https://github.com/pkissling/clock-weather-card/compare/v2.8.12...v2.9.0) (2025-08-07)


### Features

* Update AQI background colors to match airnow.gov ([#589](https://github.com/pkissling/clock-weather-card/issues/589)) ([18c8034](https://github.com/pkissling/clock-weather-card/commit/18c8034611cba880a3492949c17407e957508700))


### Bug Fixes

* **deps:** update minor-dependencies ([#579](https://github.com/pkissling/clock-weather-card/issues/579)) ([9c0beef](https://github.com/pkissling/clock-weather-card/commit/9c0beef8c7dabfd68078b25f5d2d1b83c9ee5302))

## [2.8.12](https://github.com/pkissling/clock-weather-card/compare/v2.8.11...v2.8.12) (2025-06-26)


### Bug Fixes

* **deps:** update minor-dependencies ([#549](https://github.com/pkissling/clock-weather-card/issues/549)) ([3c2d61f](https://github.com/pkissling/clock-weather-card/commit/3c2d61f497df62407c02f61894c02d92bd8ee94a))
* Update "Feels like" for cn ([#568](https://github.com/pkissling/clock-weather-card/issues/568)) ([da1b5e0](https://github.com/pkissling/clock-weather-card/commit/da1b5e07787096f40117c45588c008ac579275f6))

## [2.8.11](https://github.com/pkissling/clock-weather-card/compare/v2.8.10...v2.8.11) (2025-04-02)


### Bug Fixes

* Add additional translations for Hungarian ([#544](https://github.com/pkissling/clock-weather-card/issues/544)) ([a942e57](https://github.com/pkissling/clock-weather-card/commit/a942e57d503550f9c80508819baebb4ed403e384))
* Add Croatian language ([#543](https://github.com/pkissling/clock-weather-card/issues/543)) ([7b9fcd0](https://github.com/pkissling/clock-weather-card/commit/7b9fcd096a1c9e6573c2943b404b93268d6ebed7))
* Add feels-like translation for Slovenian ([#525](https://github.com/pkissling/clock-weather-card/issues/525)) ([7a3da16](https://github.com/pkissling/clock-weather-card/commit/7a3da16dccc22836585fc935039c842d64bc54c6))
* **deps:** update minor-dependencies ([#545](https://github.com/pkissling/clock-weather-card/issues/545)) ([b6623ef](https://github.com/pkissling/clock-weather-card/commit/b6623efa5f10af90bb704dedd44ac7239354d5f2))

## [2.8.10](https://github.com/pkissling/clock-weather-card/compare/v2.8.9...v2.8.10) (2025-02-18)


### Bug Fixes

* Add Arabic support based on [#517](https://github.com/pkissling/clock-weather-card/issues/517) ([#518](https://github.com/pkissling/clock-weather-card/issues/518)) ([da03c6e](https://github.com/pkissling/clock-weather-card/commit/da03c6ebba9a600c28d943285545ed21dbbaa12b))

## [2.8.9](https://github.com/pkissling/clock-weather-card/compare/v2.8.8...v2.8.9) (2025-02-07)


### Bug Fixes

* Added Welsh Language (Cymraeg) Localisation ([#512](https://github.com/pkissling/clock-weather-card/issues/512)) ([292ed42](https://github.com/pkissling/clock-weather-card/commit/292ed4283a419470f10fe8891e26d7cd98352f0b))

## [2.8.8](https://github.com/pkissling/clock-weather-card/compare/v2.8.7...v2.8.8) (2025-01-28)


### Bug Fixes

* Add more "feels like" translations ([#497](https://github.com/pkissling/clock-weather-card/issues/497)) ([67205d4](https://github.com/pkissling/clock-weather-card/commit/67205d41a7f7acfbcf336161715efdbe44c9699c))
* Localize "feels like" for Estonian ([#500](https://github.com/pkissling/clock-weather-card/issues/500)) ([47ee2e1](https://github.com/pkissling/clock-weather-card/commit/47ee2e15218dca9531cabb64914791c2189f71c2))
* Update to Czech translation for exceptional weather state ([#505](https://github.com/pkissling/clock-weather-card/issues/505)) ([c3641fa](https://github.com/pkissling/clock-weather-card/commit/c3641fa30f765e231117dc67f9f1db505de0ad0e))

## [2.8.7](https://github.com/pkissling/clock-weather-card/compare/v2.8.6...v2.8.7) (2024-12-19)


### Bug Fixes

* update Hebrew localize text "feels like" ([#495](https://github.com/pkissling/clock-weather-card/issues/495)) ([4dc64f1](https://github.com/pkissling/clock-weather-card/commit/4dc64f1c1ea30d0b484df8507aa78a74634b795d))

## [2.8.6](https://github.com/pkissling/clock-weather-card/compare/v2.8.5...v2.8.6) (2024-11-19)


### Bug Fixes

* Fix custom element define error ([#472](https://github.com/pkissling/clock-weather-card/issues/472)) ([722fb76](https://github.com/pkissling/clock-weather-card/commit/722fb763b56282f7b3dbfb5ab55c332c404a3390))
* Translate "Feels like" into Russian ([#464](https://github.com/pkissling/clock-weather-card/issues/464)) ([b85379f](https://github.com/pkissling/clock-weather-card/commit/b85379fdf5a341a4ad802ee36061b086ce385607))
* Update Luxembourgish translations ([#473](https://github.com/pkissling/clock-weather-card/issues/473)) ([ec584de](https://github.com/pkissling/clock-weather-card/commit/ec584decf5a78300e1652036d494513f2279c49c))

## [2.8.5](https://github.com/pkissling/clock-weather-card/compare/v2.8.4...v2.8.5) (2024-09-08)


### Bug Fixes

* Add Luxembourgish language ([#453](https://github.com/pkissling/clock-weather-card/issues/453)) ([ec776b9](https://github.com/pkissling/clock-weather-card/commit/ec776b97bda116ef5f390d93cacafcd4f0f10e89))
* Update "Feels like" for ca, es, and pt ([#450](https://github.com/pkissling/clock-weather-card/issues/450)) ([6cb9f66](https://github.com/pkissling/clock-weather-card/commit/6cb9f66938c172ff767180eb603e26f35a86dbf1))

## [2.8.4](https://github.com/pkissling/clock-weather-card/compare/v2.8.3...v2.8.4) (2024-08-29)


### Bug Fixes

* **deps:** update minor-dependencies ([#431](https://github.com/pkissling/clock-weather-card/issues/431)) ([db7eb72](https://github.com/pkissling/clock-weather-card/commit/db7eb72c21902be234ed4149788465a7e48c1ee5))
* Translate feels-like in french ([#444](https://github.com/pkissling/clock-weather-card/issues/444)) ([3af024f](https://github.com/pkissling/clock-weather-card/commit/3af024f6bfb5fefa6a053066f81278e5c83b1d25))

## [2.8.3](https://github.com/pkissling/clock-weather-card/compare/v2.8.2...v2.8.3) (2024-07-27)


### Bug Fixes

* Update indonesian translations ([#421](https://github.com/pkissling/clock-weather-card/issues/421)) ([65865a0](https://github.com/pkissling/clock-weather-card/commit/65865a03576517f7f615f0e61639b3eb9c216d38))
* Update Taiwanese translations ([#425](https://github.com/pkissling/clock-weather-card/issues/425)) ([fd636b4](https://github.com/pkissling/clock-weather-card/commit/fd636b4afd4ecc3d92af1f7e6a494f41ba5e5d8c))

## [2.8.2](https://github.com/pkissling/clock-weather-card/compare/v2.8.1...v2.8.2) (2024-07-19)


### Bug Fixes

* Add Korean translations for "AQI" and "feel like" ([#417](https://github.com/pkissling/clock-weather-card/issues/417)) ([50fd243](https://github.com/pkissling/clock-weather-card/commit/50fd24387bde29499a406612b3d0bb9f1bbe6c12))

## [2.8.1](https://github.com/pkissling/clock-weather-card/compare/v2.8.0...v2.8.1) (2024-07-13)


### Bug Fixes

* Update "feels-like" translation in it.json ([#414](https://github.com/pkissling/clock-weather-card/issues/414)) ([1c20972](https://github.com/pkissling/clock-weather-card/commit/1c209725ba187d5ba2aedc0ffb3ac9b5e0c7f920))

## [2.8.0](https://github.com/pkissling/clock-weather-card/compare/2.7.0...v2.8.0) (2024-06-20)


### Features

* Add ability to show a badge with the air quality index ([#396](https://github.com/pkissling/clock-weather-card/issues/396)) ([672bb59](https://github.com/pkissling/clock-weather-card/commit/672bb59858f00ca47a535e308e12ba4d40e6dc72))
