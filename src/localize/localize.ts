import * as ar from './languages/ar.json'
import * as bg from './languages/bg.json'
import * as da from './languages/da.json'
import * as ca from './languages/ca.json'
import * as cs from './languages/cs.json'
import * as cy from './languages/cy.json'
import * as de from './languages/de.json'
import * as el from './languages/el.json'
import * as en from './languages/en.json'
import * as es from './languages/es.json'
import * as et from './languages/et.json'
import * as fi from './languages/fi.json'
import * as fr from './languages/fr.json'
import * as he from './languages/he.json'
import * as hu from './languages/hu.json'
import * as hr from './languages/hr.json'
import * as id from './languages/id.json'
import * as is from './languages/is.json'
import * as it from './languages/it.json'
import * as ko from './languages/ko.json'
import * as lb from './languages/lb.json'
import * as lt from './languages/lt.json'
import * as nb from './languages/nb.json'
import * as nl from './languages/nl.json'
import * as pl from './languages/pl.json'
import * as ptbr from './languages/pt-br.json'
import * as pt from './languages/pt.json'
import * as ro from './languages/ro.json'
import * as ru from './languages/ru.json'
import * as sk from './languages/sk.json'
import * as sl from './languages/sl.json'
import * as sr from './languages/sr.json'
import * as srlatn from './languages/srlatn.json'
import * as sv from './languages/sv.json'
import * as th from './languages/th.json'
import * as tr from './languages/tr.json'
import * as uk from './languages/uk.json'
import * as ur from './languages/ur.json'
import * as vi from './languages/vi.json'
import * as zhcn from './languages/zh-cn.json'
import * as zhtw from './languages/zh-tw.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languages: any = {
  ar,
  bg,
  cs,
  ca,
  cy,
  da,
  de,
  el,
  en,
  es,
  et,
  fi,
  fr,
  he,
  hu,
  hr,
  id,
  is,
  it,
  ko,
  lb,
  lt,
  nb,
  nl,
  pl,
  ptbr,
  pt,
  ro,
  ru,
  sk,
  sl,
  sr,
  srlatn,
  sv,
  th,
  tr,
  uk,
  ur,
  vi,
  zhcn,
  zhtw
}

export function localize (key: string, locale: string): string {
  let translated: string
  const lang = locale
    .replace(/['"]+/g, '')
    .replace('-', '_')
    .replace('_', '')
    .toLowerCase()

  try {
    translated = key.split('.').reduce((o, i) => o[i], languages[lang])
  } catch (e) {
    translated = key.split('.').reduce((o, i) => o[i], languages.en)
  }

  if (translated === undefined) translated = key.split('.').reduce((o, i) => o[i], languages.en)

  return translated
}
