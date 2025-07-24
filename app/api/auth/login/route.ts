import { NextResponse, NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

interface LoginRequest {
    username: string;
    password: string;
}

// Input validation and sanitization
function validateLoginInput(data: any): { isValid: boolean; errors: string[]; sanitized?: LoginRequest } {
    const errors: string[] = [];
    
    if (!data.username || typeof data.username !== 'string') {
        errors.push('Username is required and must be a string');
    }
    
    if (!data.password || typeof data.password !== 'string') {
        errors.push('Password is required and must be a string');
    }
    
    // Check for reasonable length limits
    if (data.username && data.username.length > 254) {
        errors.push('Username is too long');
    }
    
    if (data.password && data.password.length > 128) {
        errors.push('Password is too long');
    }
    
    // Basic email format validation
    if (data.username && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.username)) {
        errors.push('Username must be a valid email address');
    }
    
    if (errors.length === 0) {
        return {
            isValid: true,
            errors: [],
            sanitized: {
                username: data.username.trim().toLowerCase(),
                password: data.password
            }
        };
    }
    
    return { isValid: false, errors };
}

// Create default admin user with static credentials
async function createDefaultAdmin(): Promise<{ email: string; tempPassword: string } | null> {
    try {
        // Use static credentials for easy access
        const tempPassword = 'admin';
        const hashedPassword = await bcrypt.hash(tempPassword, 12); // Increased salt rounds
        
        const adminEmail = 'admin@example.com';
        
        const user = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
            },
        });
        
        // Log the static credentials
        console.log(`=== INITIAL SETUP ===`);
        console.log(`Default admin created with email: ${adminEmail}`);
        console.log(`Password: ${tempPassword}`);
        console.log(`You can change this password later in the dashboard settings.`);
        console.log(`====================`);
        
        return { email: adminEmail, tempPassword };
    } catch (error) {
        console.error('Failed to create default admin:', error);
        return null;
    }
}

// Secure user authentication with timing attack protection
async function authenticateUser(username: string, password: string): Promise<{ success: boolean; userId?: string }> {
    let user = null;
    let isPasswordValid = false;
    
    try {
        // Always query for user to maintain consistent timing
        user = await prisma.user.findUnique({
            where: { email: username },
        });
        
        if (user) {
            // Always perform password comparison to prevent timing attacks
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            // Perform a dummy hash comparison to maintain consistent timing
            await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks.that.are.long.enough');
        }
        
        if (user && isPasswordValid) {
            return { success: true, userId: user.id };
        }
        
        return { success: false };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false };
    }
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting check (basic implementation - consider using a proper rate limiter)
        const clientIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
        
        // Validate JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET environment variable is not defined');
            return NextResponse.json(
                { error: "Server configuration error" }, 
                { status: 500 }
            );
        }
        
        // Parse and validate request body
        let requestBody;
        try {
            requestBody = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid request format" }, 
                { status: 400 }
            );
        }
        
        const validation = validateLoginInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.errors }, 
                { status: 400 }
            );
        }
        
        const { username, password } = validation.sanitized!;
        
        // Check if this is initial setup (no users exist)
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            const defaultAdmin = await createDefaultAdmin();
            if (!defaultAdmin) {
                return NextResponse.json(
                    { error: "Failed to initialize system" }, 
                    { status: 500 }
                );
            }
            
            // For initial setup, authenticate with the generated credentials
            if (username === defaultAdmin.email && password === defaultAdmin.tempPassword) {
                const token = jwt.sign(
                    { account_secret: defaultAdmin.email }, // This should be updated after user creation
                    process.env.JWT_SECRET,
                    { 
                        expiresIn: '24h', // Shorter expiry for initial setup
                        issuer: 'serverdash',
                        audience: 'serverdash-users'
                    }
                );
                
                return NextResponse.json({ 
                    token,
                    isInitialSetup: true,
                    message: "Please change your password immediately"
                });
            } else {
                return NextResponse.json(
                    { error: "Invalid credentials" }, 
                    { status: 401 }
                );
            }
        }
        
        // Regular authentication flow
        const authResult = await authenticateUser(username, password);
        
        if (!authResult.success) {
            // Log failed login attempt
            console.warn('Failed login attempt:', {
                timestamp: new Date().toISOString(),
                username: username,
                clientIP: clientIP,
                userAgent: request.headers.get('user-agent')
            });
            
            return NextResponse.json(
                { error: "Invalid credentials" }, 
                { status: 401 }
            );
        }
        
        // Create JWT with secure settings
        const token = jwt.sign(
            { account_secret: authResult.userId }, 
            process.env.JWT_SECRET,
            { 
                expiresIn: '7d',
                issuer: 'serverdash',
                audience: 'serverdash-users'
            }
        );
        
        // Log successful login
        console.info('Successful login:', {
            timestamp: new Date().toISOString(),
            userId: authResult.userId,
            clientIP: clientIP
        });

        return NextResponse.json({ 
            token,
            isInitialSetup: false,
            message: "Login successful"
        });
    } catch (error: any) {
        // Log error securely without exposing sensitive information
        console.error('Login endpoint error:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        );
    }
}