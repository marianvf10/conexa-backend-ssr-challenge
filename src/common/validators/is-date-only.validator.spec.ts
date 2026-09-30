import { isDateOnly } from './is-date-only.validator';

describe('isDateOnly', () => {
  it.each(['1977-05-25', '2024-02-29', '2024-12-31'])(
    'acepta la fecha valida %s',
    (value) => {
      expect(isDateOnly(value)).toBe(true);
    },
  );

  it.each([
    ['una fecha con hora', '2024-01-15T10:00:00Z'],
    ['el formato DD-MM-AAAA', '15-01-2024'],
    ['el formato con barras', '2024/01/15'],
    ['mes y dia sin cero', '2024-1-5'],
    ['un mes inexistente', '2024-13-01'],
    ['un dia inexistente', '2024-02-31'],
    ['un 29 de febrero sin año bisiesto', '2023-02-29'],
    ['un texto cualquiera', 'string'],
    ['una cadena vacia', ''],
  ])('rechaza %s', (_description, value) => {
    expect(isDateOnly(value)).toBe(false);
  });

  it.each([undefined, null, 20240115, new Date()])(
    'rechaza un valor que no es texto (%p)',
    (value) => {
      expect(isDateOnly(value)).toBe(false);
    },
  );
});
