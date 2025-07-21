/**
 * Comprehensive input validation utilities for ServerDash application
 * Provides reusable validation functions with security-focused approach
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    sanitized?: any;
}

/**
 * Validates and sanitizes email addresses
 * @param email - Email string to validate
 * @param required - Whether email is required
 * @returns ValidationResult
 */
export function validateEmail(email: any, required = true): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
        if (required) {
            errors.push('Email is required');
        }
        return { isValid: !required, errors, sanitized: email };
    }
    
    if (typeof email !== 'string') {
        errors.push('Email must be a string');
        return { isValid: false, errors };
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (trimmedEmail.length > 254) {
        errors.push('Email address is too long (maximum 254 characters)');
    }
    
    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmedEmail)) {
        errors.push('Email address format is invalid');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmedEmail
    };
}

/**
 * Validates and sanitizes string inputs
 * @param value - String value to validate
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validateString(
    value: any, 
    options: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        allowEmpty?: boolean;
        fieldName?: string;
    } = {}
): ValidationResult {
    const errors: string[] = [];
    const fieldName = options.fieldName || 'Field';
    
    if (value === null || value === undefined) {
        if (options.required) {
            errors.push(`${fieldName} is required`);
        }
        return { isValid: !options.required, errors, sanitized: value };
    }
    
    if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        return { isValid: false, errors };
    }
    
    const trimmed = value.trim();
    
    if (!options.allowEmpty && trimmed.length === 0 && options.required) {
        errors.push(`${fieldName} cannot be empty`);
    }
    
    if (options.minLength !== undefined && trimmed.length < options.minLength) {
        errors.push(`${fieldName} must be at least ${options.minLength} characters long`);
    }
    
    if (options.maxLength !== undefined && trimmed.length > options.maxLength) {
        errors.push(`${fieldName} must be no more than ${options.maxLength} characters long`);
    }
    
    if (options.pattern && !options.pattern.test(trimmed)) {
        errors.push(`${fieldName} format is invalid`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmed
    };
}

/**
 * Validates IP addresses (IPv4)
 * @param ip - IP address string to validate
 * @param required - Whether IP is required
 * @returns ValidationResult
 */
export function validateIPAddress(ip: any, required = true): ValidationResult {
    const errors: string[] = [];
    
    if (!ip) {
        if (required) {
            errors.push('IP address is required');
        }
        return { isValid: !required, errors, sanitized: ip };
    }
    
    if (typeof ip !== 'string') {
        errors.push('IP address must be a string');
        return { isValid: false, errors };
    }
    
    const trimmed = ip.trim();
    
    // IPv4 regex pattern
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    if (!ipv4Regex.test(trimmed)) {
        errors.push('IP address must be a valid IPv4 address');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmed
    };
}

/**
 * Validates URL format
 * @param url - URL string to validate
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validateURL(
    url: any, 
    options: {
        required?: boolean;
        allowedProtocols?: string[];
        fieldName?: string;
    } = {}
): ValidationResult {
    const errors: string[] = [];
    const fieldName = options.fieldName || 'URL';
    const allowedProtocols = options.allowedProtocols || ['http', 'https'];
    
    if (!url) {
        if (options.required) {
            errors.push(`${fieldName} is required`);
        }
        return { isValid: !options.required, errors, sanitized: url };
    }
    
    if (typeof url !== 'string') {
        errors.push(`${fieldName} must be a string`);
        return { isValid: false, errors };
    }
    
    const trimmed = url.trim();
    
    if (trimmed.length === 0) {
        if (options.required) {
            errors.push(`${fieldName} cannot be empty`);
        }
        return { isValid: !options.required, errors, sanitized: trimmed };
    }
    
    try {
        const urlObj = new URL(trimmed);
        
        if (!allowedProtocols.includes(urlObj.protocol.slice(0, -1))) {
            errors.push(`${fieldName} must use one of these protocols: ${allowedProtocols.join(', ')}`);
        }
        
        // Additional security checks
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
            // Consider if localhost should be allowed in your use case
            console.warn(`${fieldName} points to localhost - ensure this is intended`);
        }
        
    } catch (urlError) {
        errors.push(`${fieldName} must be a valid URL`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmed
    };
}

/**
 * Validates boolean values
 * @param value - Value to validate as boolean
 * @param fieldName - Name of the field for error messages
 * @returns ValidationResult
 */
export function validateBoolean(value: any, fieldName = 'Field'): ValidationResult {
    const errors: string[] = [];
    
    if (typeof value !== 'boolean') {
        errors.push(`${fieldName} must be a boolean value`);
        return { isValid: false, errors };
    }
    
    return {
        isValid: true,
        errors: [],
        sanitized: value
    };
}

/**
 * Validates integer values
 * @param value - Value to validate as integer
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validateInteger(
    value: any,
    options: {
        required?: boolean;
        min?: number;
        max?: number;
        fieldName?: string;
    } = {}
): ValidationResult {
    const errors: string[] = [];
    const fieldName = options.fieldName || 'Field';
    
    if (value === null || value === undefined) {
        if (options.required) {
            errors.push(`${fieldName} is required`);
        }
        return { isValid: !options.required, errors, sanitized: value };
    }
    
    if (!Number.isInteger(value)) {
        errors.push(`${fieldName} must be an integer`);
        return { isValid: false, errors };
    }
    
    if (options.min !== undefined && value < options.min) {
        errors.push(`${fieldName} must be at least ${options.min}`);
    }
    
    if (options.max !== undefined && value > options.max) {
        errors.push(`${fieldName} must be no more than ${options.max}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: value
    };
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validatePassword(
    password: any,
    options: {
        minLength?: number;
        requireUppercase?: boolean;
        requireLowercase?: boolean;
        requireNumbers?: boolean;
        requireSpecialChars?: boolean;
        maxLength?: number;
    } = {}
): ValidationResult {
    const errors: string[] = [];
    const {
        minLength = 8,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSpecialChars = true,
        maxLength = 128
    } = options;
    
    if (!password) {
        errors.push('Password is required');
        return { isValid: false, errors };
    }
    
    if (typeof password !== 'string') {
        errors.push('Password must be a string');
        return { isValid: false, errors };
    }
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (password.length > maxLength) {
        errors.push(`Password must be no more than ${maxLength} characters long`);
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: password // Don't sanitize passwords
    };
}

/**
 * Sanitizes and validates object with multiple fields
 * @param data - Object to validate
 * @param schema - Validation schema
 * @returns ValidationResult with sanitized object
 */
export function validateObject(
    data: any,
    schema: Record<string, (value: any) => ValidationResult>
): ValidationResult {
    const errors: string[] = [];
    const sanitized: Record<string, any> = {};
    
    if (typeof data !== 'object' || data === null) {
        return {
            isValid: false,
            errors: ['Data must be an object'],
            sanitized: {}
        };
    }
    
    for (const [field, validator] of Object.entries(schema)) {
        const result = validator(data[field]);
        
        if (!result.isValid) {
            errors.push(...result.errors);
        } else {
            sanitized[field] = result.sanitized;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
} 