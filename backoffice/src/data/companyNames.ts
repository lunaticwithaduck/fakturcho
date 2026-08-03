import type { Rng } from './seed';
import { pick, randomInt } from './seed';

export const NAME_ROOTS = [
  'Балкан',
  'Витоша',
  'Тракия',
  'Родопи',
  'Дунав',
  'Марица',
  'Слънце',
  'Симетрия',
  'Хермес',
  'Орфей',
  'Алфа',
  'Верея',
  'Прима',
  'Метро',
  'Централ',
  'Норд',
  'Атлас',
  'Дигитал',
  'Юнион',
  'Прогрес',
] as const;

export const NAME_SUFFIXES = [
  'Груп',
  'Трейд',
  'Строй',
  'Технолоджис',
  'Консулт',
  'Сервиз',
  'Импорт',
  'Дизайн',
  'Логистика',
  'Софт',
  'Инженеринг',
  'Комерс',
  'Партнерс',
  'Ивент',
] as const;

export const LEGAL_FORMS = ['ООД', 'ЕООД', 'АД'] as const;

export const CITIES = [
  'София',
  'Пловдив',
  'Варна',
  'Бургас',
  'Русе',
  'Стара Загора',
  'Плевен',
  'Сливен',
  'Добрич',
  'Шумен',
  'Перник',
  'Хасково',
  'Ямбол',
  'Пазарджик',
  'Благоевград',
  'Велико Търново',
] as const;

const FIRST_NAMES = [
  'Иван',
  'Мария',
  'Георги',
  'Елена',
  'Петър',
  'Десислава',
  'Николай',
  'Виктория',
  'Стоян',
  'Радост',
] as const;

const LAST_NAMES = [
  'Иванов',
  'Петрова',
  'Георгиев',
  'Димитрова',
  'Николов',
  'Тодорова',
  'Ангелов',
  'Кирова',
] as const;

const BIC_CODES = ['UBBSBGSF', 'BUINBGSF', 'STSABGSF', 'CECBBGSF', 'FINVBGSF', 'RZBBBGSF'] as const;
const BANK_CODES = ['UBBS', 'BUIN', 'STSA', 'CECB', 'FINV', 'RZBB'] as const;

export function buildCompanyName(rng: Rng): string {
  const root = pick(rng, NAME_ROOTS);
  const suffix = pick(rng, NAME_SUFFIXES);
  const legalForm = pick(rng, LEGAL_FORMS);
  return `${root} ${suffix} ${legalForm}`;
}

export function buildPersonName(rng: Rng): string {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

export function buildEik(rng: Rng): string {
  return String(randomInt(rng, 100000000, 999999999));
}

export function buildVatNumber(eik: string): string {
  return `BG${eik}`;
}

export function buildIban(rng: Rng): string {
  const check = String(randomInt(rng, 10, 99));
  const bank = pick(rng, BANK_CODES);
  const branch = String(randomInt(rng, 1000, 9999));
  const accountType = String(randomInt(rng, 10, 99));
  const account = String(randomInt(rng, 10000000, 99999999));
  return `BG${check}${bank}${branch}${accountType}${account}`;
}

export function buildBic(rng: Rng): string {
  return pick(rng, BIC_CODES);
}

export function buildPhone(rng: Rng): string {
  return `+359 8${randomInt(rng, 7, 9)} ${randomInt(rng, 100, 999)} ${randomInt(rng, 1000, 9999)}`;
}
