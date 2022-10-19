import * as bg from './languages/bg.json';
import * as da from './languages/da.json';
import * as de from './languages/de.json';
import * as en from './languages/en.json';
import * as es from './languages/es.json';
import * as fr from './languages/fr.json';
import * as nl from './languages/nl.json';
import * as pl from './languages/pl.json';
import * as pt from './languages/pt.json';
import * as ptbr from './languages/pt-br.json';
import * as uk from './languages/uk.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languages: any = {
  bg,
  da,
  de,
  en,
  es,
  fr,
  nl,
  pl,
  pt,
  ptbr,
  uk,
};

export function localize(key: string, locale: string): string {
  let translated: string;
  const lang = locale
    .replace(/['"]+/g, '')
    .replace('-', '_')
    .replace('_', '')
    .toLowerCase();

  try {
    translated = key.split('.').reduce((o, i) => o[i], languages[lang]);
  } catch (e) {
    translated = key.split('.').reduce((o, i) => o[i], languages['en']);
  }

  if (translated === undefined) translated = key.split('.').reduce((o, i) => o[i], languages['en']);

  return translated;
}
