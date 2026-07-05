// various validation checks logic
console.log("validation.ts loaded");
export const UCF_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@ucf\.edu$/i;
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/\\;']).{8,20}$/;

export function isUcfEmail(email: string) {
  return UCF_EMAIL_REGEX.test(email);
}

export function passwordChecks(password: string) {
  return {
    hasLength: password.length >= 8 && password.length <= 20,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/\\;']/.test(password),
  };
}

// Backend requires a unique username at registration, but the user picks
// their real one later (Profile Setup). Generate a throwaway, collision-resistant
// handle from their name so registration can proceed without asking for it twice.
export function makeTempUsername(firstName: string, lastName: string) {
  const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || 'user'}${suffix}`;
}


export function isValidUsername(username: string) {
  return username.length >= 3 && username.length <= 30;
}