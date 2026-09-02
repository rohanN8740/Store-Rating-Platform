// Validation utility functions

export const validateName = (name) => {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 20 && trimmed.length <= 60;
};

export const validateAddress = (address) => {
  if (!address || typeof address !== "string") return false;
  return address.trim().length <= 400;
};

export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (!password || typeof password !== "string") return false;

  // 8-16 characters
  if (password.length < 8 || password.length > 16) return false;

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;

  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

  return true;
};

export const validateRating = (rating) => {
  const ratingNum = parseInt(rating, 10);
  return !isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5;
};

export const validateRole = (role) => {
  return ["ADMIN", "USER", "STORE_OWNER"].includes(role);
};
