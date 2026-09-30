import { registerDecorator, ValidationOptions } from 'class-validator';

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

// Acepta solo fechas reales con formato AAAA-MM-DD (sin hora)
export function isDateOnly(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const match = DATE_ONLY.exec(value);
  if (!match) return false;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Rechaza fechas inexistentes como 2024-02-31, que Date corrige en silencio
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function IsDateOnly(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid date in YYYY-MM-DD format`,
        ...validationOptions,
      },
      validator: { validate: isDateOnly },
    });
  };
}
