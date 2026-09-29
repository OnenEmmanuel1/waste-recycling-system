/**
 * Server-side input validation.
 *
 * Every mutating route runs its input through these helpers. Rules follow the
 * specification: required item type and campus location for reports, required
 * quantity and item type for recycling logs, coordinates constrained to
 * Nigeria, and feedback ratings limited to 1-5.
 */

/** Thrown when submitted input fails validation; `fields` maps field -> message. */
export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/** Inclusive bounding box around Nigeria, used to sanity-check center coordinates. */
export const NIGERIA_BOUNDS = Object.freeze({
  minLatitude: 4.2,
  maxLatitude: 13.9,
  minLongitude: 2.6,
  maxLongitude: 14.7,
});

export const CENTER_CERTIFICATION = Object.freeze(['Certified', 'Unverified']);
export const ARTICLE_CATEGORIES = Object.freeze(['Awareness', 'Policy']);
export const REPORT_STATUSES = Object.freeze(['Pending', 'Reviewed', 'Resolved']);
export const USER_ROLES = Object.freeze(['PublicUser', 'RegisteredUser', 'Administrator']);

export const MIN_PASSWORD_LENGTH = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

/** Returns a required trimmed string, or throws with a field-specific message. */
export const requireText = (value, field, label, maxLength = 150) => {
  const text = isBlank(value) ? '' : String(value).trim();

  if (text === '') {
    throw new ValidationError(`${label} is required.`, { [field]: `${label} is required.` });
  }

  if (text.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`, {
      [field]: `${label} must be ${maxLength} characters or fewer.`,
    });
  }

  return text;
};

/** Returns a trimmed string or null when the field was left empty. */
export const optionalText = (value, field, label, maxLength = 200) => {
  if (isBlank(value)) {
    return null;
  }

  const text = String(value).trim();

  if (text.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`, {
      [field]: `${label} must be ${maxLength} characters or fewer.`,
    });
  }

  return text;
};

export const requireEmail = (value) => {
  const email = isBlank(value) ? '' : String(value).trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email) || email.length > 100) {
    throw new ValidationError('Enter a valid email address.', {
      email: 'Enter a valid email address.',
    });
  }

  return email;
};

export const requirePassword = (value) => {
  const password = typeof value === 'string' ? value : '';

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, {
      password: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }

  if (password.length > 200) {
    throw new ValidationError('Password must be 200 characters or fewer.', {
      password: 'Password must be 200 characters or fewer.',
    });
  }

  return password;
};

export const requireEnum = (value, allowed, field, label) => {
  const candidate = isBlank(value) ? '' : String(value).trim();

  if (!allowed.includes(candidate)) {
    throw new ValidationError(`${label} must be one of: ${allowed.join(', ')}.`, {
      [field]: `${label} is invalid.`,
    });
  }

  return candidate;
};

export const requireInteger = (value, field, label, min = 1, max = Number.MAX_SAFE_INTEGER) => {
  const text = String(value ?? '').trim();
  const parsed = /^\d+$/.test(text) ? Number(text) : Number.NaN;

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`${label} is invalid.`, { [field]: `${label} is invalid.` });
  }

  return parsed;
};

/** Rating is optional; when present it must be a whole number from 1 to 5. */
export const optionalRating = (value, field = 'rating') => {
  if (isBlank(value)) {
    return null;
  }

  const text = String(value).trim();
  const parsed = /^\d+$/.test(text) ? Number(text) : Number.NaN;

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    throw new ValidationError('Rating must be a whole number between 1 and 5.', {
      [field]: 'Rating must be between 1 and 5.',
    });
  }

  return parsed;
};

/** Coordinates are validated against Nigeria's bounding box. */
export const requireCoordinates = (latitude, longitude) => {
  const latText = String(latitude ?? '').trim();
  const lonText = String(longitude ?? '').trim();
  const lat = latText === '' ? Number.NaN : Number(latText);
  const lon = lonText === '' ? Number.NaN : Number(lonText);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new ValidationError('Latitude and longitude must be numbers.', {
      latitude: 'Enter a numeric latitude.',
      longitude: 'Enter a numeric longitude.',
    });
  }

  if (lat < NIGERIA_BOUNDS.minLatitude || lat > NIGERIA_BOUNDS.maxLatitude) {
    throw new ValidationError(
      `Latitude must be between ${NIGERIA_BOUNDS.minLatitude} and ${NIGERIA_BOUNDS.maxLatitude} (within Nigeria).`,
      { latitude: 'Latitude is outside Nigeria.' }
    );
  }

  if (lon < NIGERIA_BOUNDS.minLongitude || lon > NIGERIA_BOUNDS.maxLongitude) {
    throw new ValidationError(
      `Longitude must be between ${NIGERIA_BOUNDS.minLongitude} and ${NIGERIA_BOUNDS.maxLongitude} (within Nigeria).`,
      { longitude: 'Longitude is outside Nigeria.' }
    );
  }

  return { latitude: Number(lat.toFixed(6)), longitude: Number(lon.toFixed(6)) };
};

export const isBlankValue = isBlank;
