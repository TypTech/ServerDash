import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface AuthResult {
    isValid: boolean;
    userId?: string;
    error?: string;
    statusCode?: number;
}

interface AuthenticatedUser {
    id: string;
    email: string;
}

/**
 * Middleware for authenticating API requests using JWT tokens
 * @param request - The NextRequest object
 * @param options - Configuration options for authentication
 * @returns Promise<AuthResult> - Authentication result with user info or error
 */
export async function authenticateRequest(
    request: NextRequest,
    options: {
        requireAuth?: boolean;
        allowedRoles?: string[];
    } = { requireAuth: true }
): Promise<AuthResult> {
    try {
        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET environment variable is not defined');
            return { 
                isValid: false, 
                error: 'Server configuration error', 
                statusCode: 500 
            };
        }

        // Extract authorization header
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
            if (options.requireAuth) {
                return { 
                    isValid: false, 
                    error: 'Authorization header is required', 
                    statusCode: 401 
                };
            }
            return { isValid: true };
        }

        if (!authHeader.startsWith('Bearer ')) {
            return { 
                isValid: false, 
                error: 'Authorization header must use Bearer token format', 
                statusCode: 401 
            };
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return { 
                isValid: false, 
                error: 'Token is required', 
                statusCode: 401 
            };
        }

        // Verify and decode JWT
        let decoded: JwtPayload & { account_secret: string };
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: 'serverdash',
                audience: 'serverdash-users'
            }) as JwtPayload & { account_secret: string };
        } catch (jwtError: any) {
            let errorMessage = 'Invalid token';
            
            if (jwtError.name === 'TokenExpiredError') {
                errorMessage = 'Token has expired';
            } else if (jwtError.name === 'JsonWebTokenError') {
                errorMessage = 'Malformed token';
            }
            
            return { 
                isValid: false, 
                error: errorMessage, 
                statusCode: 401 
            };
        }

        // Validate token structure
        if (!decoded.account_secret) {
            return { 
                isValid: false, 
                error: 'Invalid token structure', 
                statusCode: 401 
            };
        }

        // Verify user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.account_secret },
            select: {
                id: true,
                email: true,
                // Add role field when implemented
                // role: true
            }
        });

        if (!user) {
            return { 
                isValid: false, 
                error: 'User not found or has been deactivated', 
                statusCode: 401 
            };
        }

        // Role-based authorization (when roles are implemented)
        if (options.allowedRoles && options.allowedRoles.length > 0) {
            // TODO: Implement role checking when user roles are added to the schema
            // if (!options.allowedRoles.includes(user.role)) {
            //     return { 
            //         isValid: false, 
            //         error: 'Insufficient permissions', 
            //         statusCode: 403 
            //     };
            // }
        }

        return { 
            isValid: true, 
            userId: user.id 
        };

    } catch (error: any) {
        console.error('Authentication middleware error:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        
        return { 
            isValid: false, 
            error: 'Authentication service unavailable', 
            statusCode: 500 
        };
    }
}

/**
 * Utility function to get authenticated user details
 * @param request - The NextRequest object
 * @returns Promise<AuthenticatedUser | null> - User details or null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.isValid || !authResult.userId) {
        return null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: {
                id: true,
                email: true
            }
        });

        return user;
    } catch (error) {
        console.error('Error fetching authenticated user:', error);
        return null;
    }
}

/**
 * Security logging utility for authentication events
 * @param event - The type of security event
 * @param details - Additional details about the event
 * @param request - The NextRequest object for context
 */
export function logSecurityEvent(
    event: 'login_success' | 'login_failure' | 'token_expired' | 'unauthorized_access' | 'suspicious_activity',
    details: Record<string, any>,
    request: NextRequest
) {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        clientIP,
        userAgent: request.headers.get('user-agent'),
        ...details
    };

    // In production, consider using a structured logging service
    if (event === 'login_failure' || event === 'unauthorized_access' || event === 'suspicious_activity') {
        console.warn('Security event:', logEntry);
    } else {
        console.info('Security event:', logEntry);
    }
} 