"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import axios from "axios"
import { AlertCircle, KeyRound, Mail, User } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {useTranslations} from 'next-intl';

export default function Home() {
  const t = useTranslations('Home');
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const [error, setError] = useState("")
  const [errorVisible, setErrorVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const token = Cookies.get("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  interface LoginResponse {
    token: string
  }

  const login = async () => {
    if (!username || !password) {
      setError("Please enter both email and password")
      setErrorVisible(true)
      return
    }

    try {
      setIsLoading(true)
      const response = await axios.post("/api/auth/login", { username, password })
      const { token } = response.data as LoginResponse

      const cookieOptions = rememberMe ? { expires: 7 } : {}
      Cookies.set("token", token, cookieOptions)

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.response?.data?.error || "Login failed. Please try again.")
      setErrorVisible(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      login()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">ServerDash</h1>
          <p className="text-muted-foreground">{t('LoginCardDescription')}</p>
        </div>

        <Card className="border-muted/40 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">{t('LoginCardTitle')}</CardTitle>
            <CardDescription>{t('LoginCardDescription')}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorVisible && (
              <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('AuthenticationError')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('Email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="mail@example.com"
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('Password')}
                  </Label>
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" onClick={login} disabled={isLoading}>
              {isLoading ? t('SigninButtonSigningIn') : t('SigninButton')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
