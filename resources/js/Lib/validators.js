export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

export function isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

export function minLength(value, min) {
    if (!value || typeof value !== 'string') return false;
    return value.trim().length >= min;
}

export function maxLength(value, max) {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string') return false;
    return value.length <= max;
}

export function isNumeric(value) {
    if (value === null || value === undefined || value === '') return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
}

export function isInteger(value) {
    if (!isNumeric(value)) return false;
    return Number.isInteger(parseFloat(value));
}

export function minValue(value, min) {
    if (!isNumeric(value)) return false;
    return parseFloat(value) >= min;
}

export function maxValue(value, max) {
    if (!isNumeric(value)) return false;
    return parseFloat(value) <= max;
}

export function between(value, min, max) {
    return minValue(value, min) && maxValue(value, max);
}

export function isValidCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;
    
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[10])) return false;
    
    return true;
}

export function isValidCNPJ(cnpj) {
    if (!cnpj || typeof cnpj !== 'string') return false;
    
    const cleaned = cnpj.replace(/\D/g, '');
    
    if (cleaned.length !== 14) return false;
    
    if (/^(\d)\1{13}$/.test(cleaned)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned[i]) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit1 !== parseInt(cleaned[12])) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned[i]) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return digit2 === parseInt(cleaned[13]);
}

export function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    const cleaned = phone.replace(/\D/g, '');
    
    return cleaned.length >= 10 && cleaned.length <= 11;
}

export function isValidDate(date) {
    if (!date) return false;
    
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
}

export function isFutureDate(date) {
    if (!isValidDate(date)) return false;
    return new Date(date) > new Date();
}

export function isPastDate(date) {
    if (!isValidDate(date)) return false;
    return new Date(date) < new Date();
}

export function validatePassword(password) {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['Senha é obrigatória'] };
    }
    
    if (password.length < 8) {
        errors.push('Senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Senha deve conter pelo menos um caractere especial');
    }
    
    return { valid: errors.length === 0, errors };
}

export function isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function createValidator(rules) {
    return (data) => {
        const errors = {};
        
        for (const [field, fieldRules] of Object.entries(rules)) {
            for (const rule of fieldRules) {
                const value = data[field];
                
                if (!rule.test(value)) {
                    errors[field] = rule.message;
                    break;
                }
            }
        }
        
        return errors;
    };
}

export function hasErrors(errors) {
    return Object.keys(errors).length > 0;
}
