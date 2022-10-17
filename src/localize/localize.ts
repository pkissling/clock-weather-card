import * as bg from './languages/bg.json';
import * as da from './languages/da.json';
import * as de from './languages/de.json';
import * as en from './languages/en.json';
import * as fr from './languages/fr.json';
import * as nl from './languages/nl.json';
import * as pl from './languages/pl.json';
import * as ptBR from './languages/da.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languages: any = {
  bg,
  da,
  de,
  en,
  fr,
  nl,
  pl,
  ptBR
};

export function localize(key: string): string {
  let translated: string;
  const lang = (localStorage.getItem('selectedLanguage') || 'en')
    .replace(/['"]+/g, '')
    .replace('-', '_')
    .replace('_', '');

  try {
    translated = key.split('.').reduce((o, i) => o[i], languages[lang]);
  } catch (e) {
    translated = key.split('.').reduce((o, i) => o[i], languages['en']);
  }

  if (translated === undefined) translated = key.split('.').reduce((o, i) => o[i], languages['en']);

  return translated;
}
