// client/app/utils/validation.ts
// Fonctions pour valider les entrées utilisateur (correspond aux règles Zod du backend)

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return "L'email est requis";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Format d'email invalide";
  }

  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Le mot de passe est requis';
  }

  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }

  return null;
};

export const validateDisplayName = (displayName: string): string | null => {
  if (!displayName) {
    return "Le nom d'utilisateur est requis";
  }

  if (displayName.length < 2) {
    return "Le nom d'utilisateur doit contenir au moins 2 caractères";
  }

  return null;
};

export const validateNationalRegisterNumber = (nrn?: string): string | null => {
  if (!nrn) return null; // Optionnel

  // Format belge: XX.XX.XX-XXX.XX
  const nrnRegex = /^\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}$/;
  if (!nrnRegex.test(nrn)) {
    return 'Format de numéro de registre national invalide (XX.XX.XX-XXX.XX)';
  }

  return null;
};

// Exporter toutes les fonctions de validation
const validation = {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateNationalRegisterNumber
};

export default validation;
