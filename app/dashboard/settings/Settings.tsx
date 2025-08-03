"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Palette, User, Bell, AtSign, Send, MessageSquare, Trash2, Play, Languages, Download, RefreshCw, ExternalLink, Info } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"

interface NotificationsResponse {
  notifications: any[]
}
interface NotificationResponse {
  notification_text_application?: string
  notification_text_server?: string
}

interface UpdateResponse {
  success: boolean
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  releaseInfo: {
    name: string
    publishedAt: string
    htmlUrl: string
    body: string
    isPrerelease: boolean
  }
  lastChecked: string
  error?: string
}

export default function Settings() {
  const t = useTranslations('Settings')
  const { theme, setTheme } = useTheme()

  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [oldPassword, setOldPassword] = useState<string>("")

  const [emailError, setEmailError] = useState<string>("")
  const [passwordError, setPasswordError] = useState<string>("")
  const [emailErrorVisible, setEmailErrorVisible] = useState<boolean>(false)
  const [passwordErrorVisible, setPasswordErrorVisible] = useState<boolean>(false)

  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false)
  const [emailSuccess, setEmailSuccess] = useState<boolean>(false)

  const [notificationType, setNotificationType] = useState<string>("")
  const [notificationName, setNotificationName] = useState<string>("")
  const [smtpHost, setSmtpHost] = useState<string>("")
  const [smtpPort, setSmtpPort] = useState<number>(0)
  const [smtpSecure, setSmtpSecure] = useState<boolean>(false)
  const [smtpUsername, setSmtpUsername] = useState<string>("")
  const [smtpPassword, setSmtpPassword] = useState<string>("")
  const [smtpFrom, setSmtpFrom] = useState<string>("")
  const [smtpTo, setSmtpTo] = useState<string>("")
  const [telegramToken, setTelegramToken] = useState<string>("")
  const [telegramChatId, setTelegramChatId] = useState<string>("")
  const [discordWebhook, setDiscordWebhook] = useState<string>("")
  const [gotifyUrl, setGotifyUrl] = useState<string>("")
  const [gotifyToken, setGotifyToken] = useState<string>("")
  const [ntfyUrl, setNtfyUrl] = useState<string>("")
  const [ntfyToken, setNtfyToken] = useState<string>("")
  const [pushoverUrl, setPushoverUrl] = useState<string>("")
  const [pushoverToken, setPushoverToken] = useState<string>("")
  const [pushoverUser, setPushoverUser] = useState<string>("")
  const [echobellURL, setEchobellURL] = useState<string>("")
  const [language, setLanguage] = useState<string>("english")
  const [notifications, setNotifications] = useState<any[]>([])

  const [notificationTextApplication, setNotificationTextApplication] = useState<string>("")
  const [notificationTextServer, setNotificationTextServer] = useState<string>("")

  // Update manager state
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [checkingForUpdates, setCheckingForUpdates] = useState<boolean>(false)
  const [lastUpdateCheck, setLastUpdateCheck] = useState<string>("")

  const changeEmail = async () => {
    setEmailErrorVisible(false)
    setEmailSuccess(false)
    setEmailError("")

    if (!email) {
      setEmailError(t('Settings.UserSettings.ChangeEmail.EmailRequired'))
      setEmailErrorVisible(true)
      setTimeout(() => {
        setEmailErrorVisible(false)
        setEmailError("")
      }, 3000)
      return
    }
    try {
      await axios.post("/api/auth/edit_email", {
        newEmail: email,
        jwtToken: Cookies.get("token"),
      })
      setEmailSuccess(true)
      setEmail("")
      setTimeout(() => {
        setEmailSuccess(false)
      }, 3000)
    } catch (error: any) {
      setEmailError(error.response.data.error)
      setEmailErrorVisible(true)
      setTimeout(() => {
        setEmailErrorVisible(false)
        setEmailError("")
      }, 3000)
    }
  }

  const changePassword = async () => {
    try {
      if (password !== confirmPassword) {
        setPasswordError(t('Settings.UserSettings.ChangePassword.PasswordsDontMatch'))
        setPasswordErrorVisible(true)
        setTimeout(() => {
          setPasswordErrorVisible(false)
          setPasswordError("")
        }, 3000)
        return
      }
      if (!oldPassword || !password || !confirmPassword) {
        setPasswordError(t('Settings.UserSettings.ChangePassword.AllFieldsRequired'))
        setPasswordErrorVisible(true)
        setTimeout(() => {
          setPasswordErrorVisible(false)
          setPasswordError("")
        }, 3000)
        return
      }

      const response = await axios.post("/api/auth/edit_password", {
        oldPassword: oldPassword,
        newPassword: password,
        jwtToken: Cookies.get("token"),
      })

      if (response.status === 200) {
        setPasswordSuccess(true)
        setPassword("")
        setOldPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          setPasswordSuccess(false)
        }, 3000)
      }
    } catch (error: any) {
      setPasswordErrorVisible(true)
      setPasswordError(error.response.data.error)
      setTimeout(() => {
        setPasswordErrorVisible(false)
        setPasswordError("")
      }, 3000)
    }
  }

  const addNotification = async () => {
    try {
      const response = await axios.post("/api/notifications/add", {
        name: notificationName,
        type: notificationType,
        smtpHost: smtpHost,
        smtpPort: smtpPort,
        smtpSecure: smtpSecure,
        smtpUsername: smtpUsername,
        smtpPassword: smtpPassword,
        smtpFrom: smtpFrom,
        smtpTo: smtpTo,
        telegramToken: telegramToken,
        telegramChatId: telegramChatId,
        discordWebhook: discordWebhook,
        gotifyUrl: gotifyUrl,
        gotifyToken: gotifyToken,
        ntfyUrl: ntfyUrl,
        ntfyToken: ntfyToken,
        pushoverUrl: pushoverUrl,
        pushoverToken: pushoverToken,
        pushoverUser: pushoverUser,
        echobellURL: echobellURL,
      })
      getNotifications()
    } catch (error: any) {
      alert(error.response.data.error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const response = await axios.post("/api/notifications/delete", {
        id: id,
      })
      if (response.status === 200) {
        getNotifications()
      }
    } catch (error: any) {
      alert(error.response.data.error)
    }
  }

  const getNotifications = async () => {
    try {
      const response = await axios.post<NotificationsResponse>("/api/notifications/get", {})
      if (response.status === 200 && response.data) {
        setNotifications(response.data.notifications)
      }
    } catch (error: any) {
      alert(error.response.data.error)
    }
  }

  useEffect(() => {
    getNotifications()
  }, [])

  const getNotificationText = async () => {
    try {
      const response = await axios.post<NotificationResponse>("/api/settings/get_notification_text", {})
      if (response.status === 200) {
        if (response.data.notification_text_application) {
          setNotificationTextApplication(response.data.notification_text_application)
        } else {
          setNotificationTextApplication("The application !name (!url) is now !status.")
        }
        if (response.data.notification_text_server) {
          setNotificationTextServer(response.data.notification_text_server)
        } else {
          setNotificationTextServer("The server !name is now !status.")
        }
      }
    } catch (error: any) {
      alert(error.response.data.error)
    }
  }

  const editNotificationText = async () => {
    try {
      const response = await axios.post("/api/settings/notification_text", {
        text_application: notificationTextApplication,
        text_server: notificationTextServer,
      })
    } catch (error: any) {
      alert(error.response.data.error)
    }
  }

  useEffect(() => {
    getNotificationText()
  }, [])

  const testNotification = async (id: number) => {
    try {
      const response = await axios.post("/api/notifications/test", {
        notificationId: id,
      })
      toast.success(t('Settings.Notifications.TestSuccess'))
    } catch (error: any) {
      toast.error(error.response.data.error)
    }
  }

  useEffect(() => {
    const language = Cookies.get("language")
    if (language === "en") {
      setLanguage("english")
    } else if (language === "de") {
      setLanguage("german")
    }
  }, [])

  const setLanguageFunc = (value: string) => {
    setLanguage(value)
    if (value === "english") {
      Cookies.set("language", "en")
    } else if (value === "german") {
      Cookies.set("language", "de")
    }
    // Reload the page
    window.location.reload()
  }

  const checkForUpdates = async () => {
    setCheckingForUpdates(true)
    try {
      const response = await axios.get<UpdateResponse>("/api/system/check-version")
      if (response.status === 200) {
        setUpdateInfo(response.data)
        setLastUpdateCheck(new Date().toLocaleString())
        if (response.data.updateAvailable) {
          toast.success(t('UpdateManager.UpdateAvailable'))
        } else {
          toast.success(t('UpdateManager.UpToDate'))
        }
      }
    } catch (error: any) {
      console.error("Failed to check for updates:", error)
      toast.error(error.response?.data?.error || t('UpdateManager.CheckFailed'))
    } finally {
      setCheckingForUpdates(false)
    }
  }

  // Check for updates on component mount
  useEffect(() => {
    checkForUpdates()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>{t('Settings.Breadcrumb.Dashboard')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('Settings.Breadcrumb.Settings')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-6">
          <div className="pb-4">
            <span className="text-3xl font-bold">{t('Settings.Title')}</span>
          </div>
          <div className="grid gap-6">
            <Card className="overflow-hidden border-2 border-muted/20 shadow-sm">
              <CardHeader className="bg-muted/10 px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t('Settings.UserSettings.Title')}</h2>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-sm text-muted-foreground mb-6">
                  {t('Settings.UserSettings.Description')}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="font-semibold text-lg">{t('Settings.UserSettings.ChangeEmail.Title')}</h3>
                    </div>

                    {emailErrorVisible && (
                      <Alert variant="destructive" className="animate-in fade-in-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('Common.Error')}</AlertTitle>
                        <AlertDescription>{emailError}</AlertDescription>
                      </Alert>
                    )}

                    {emailSuccess && (
                      <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300 animate-in fade-in-50">
                        <Check className="h-4 w-4" />
                        <AlertTitle>{t('Settings.UserSettings.ChangeEmail.Success')}</AlertTitle>
                      </Alert>
                    )}

                    <div className="space-y-3">
                      <Input
                        type="email"
                        placeholder={t('Settings.UserSettings.ChangeEmail.Placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                      />
                      <Button onClick={changeEmail} className="w-full h-11">
                        {t('Settings.UserSettings.ChangeEmail.Button')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="font-semibold text-lg">{t('Settings.UserSettings.ChangePassword.Title')}</h3>
                    </div>

                    {passwordErrorVisible && (
                      <Alert variant="destructive" className="animate-in fade-in-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('Common.Error')}</AlertTitle>
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    {passwordSuccess && (
                      <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300 animate-in fade-in-50">
                        <Check className="h-4 w-4" />
                        <AlertTitle>{t('Settings.UserSettings.ChangePassword.Success')}</AlertTitle>
                      </Alert>
                    )}

                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder={t('Settings.UserSettings.ChangePassword.OldPassword')}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="h-11"
                      />
                      <Input
                        type="password"
                        placeholder={t('Settings.UserSettings.ChangePassword.NewPassword')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11"
                      />
                      <Input
                        type="password"
                        placeholder={t('Settings.UserSettings.ChangePassword.ConfirmPassword')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11"
                      />
                      <Button onClick={changePassword} className="w-full h-11">
                        {t('Settings.UserSettings.ChangePassword.Button')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 border-muted/20 shadow-sm">
              <CardHeader className="bg-muted/10 px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t('Settings.ThemeSettings.Title')}</h2>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-sm text-muted-foreground mb-6">
                  {t('Settings.ThemeSettings.Description')}
                </div>

                <div className="max-w-md">
                  <Select value={theme} onValueChange={(value: string) => setTheme(value)}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue>
                        {t(`Settings.ThemeSettings.${(theme ?? "system").charAt(0).toUpperCase() + (theme ?? "system").slice(1)}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('Settings.ThemeSettings.Light')}</SelectItem>
                      <SelectItem value="dark">{t('Settings.ThemeSettings.Dark')}</SelectItem>
                      <SelectItem value="system">{t('Settings.ThemeSettings.System')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 border-muted/20 shadow-sm">
              <CardHeader className="bg-muted/10 px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t('Settings.LanguageSettings.Title')}</h2>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-sm text-muted-foreground mb-6">
                  {t('Settings.LanguageSettings.Description')}
                </div>

                <div className="max-w-md">
                  <Select value={language} onValueChange={(value: string) => setLanguageFunc(value)}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue>
                        {t(`Settings.LanguageSettings.${(language ?? "english").charAt(0).toUpperCase() + (language ?? "english").slice(1)}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">{t('Settings.LanguageSettings.English')}</SelectItem>
                      <SelectItem value="german">{t('Settings.LanguageSettings.German')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 border-muted/20 shadow-sm">
              <CardHeader className="bg-muted/10 px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t('UpdateManager.Title')}</h2>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-sm text-muted-foreground mb-6">
                  {t('UpdateManager.Description')}
                </div>

                <div className="space-y-4">
                  {updateInfo && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('UpdateManager.CurrentVersion')}:</span>
                          <span className="font-medium">{updateInfo.currentVersion}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('UpdateManager.LatestVersion')}:</span>
                          <span className="font-medium">{updateInfo.latestVersion}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('UpdateManager.Status')}:</span>
                          <div className="flex items-center gap-2">
                            {updateInfo.updateAvailable ? (
                              <>
                                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-orange-600 font-medium">{t('UpdateManager.UpdateAvailable')}</span>
                              </>
                            ) : (
                              <>
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-600 font-medium">{t('UpdateManager.UpToDate')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {lastUpdateCheck && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('UpdateManager.LastChecked')}:</span>
                            <span className="font-medium text-xs">{lastUpdateCheck}</span>
                          </div>
                        )}
                      </div>

                      {updateInfo.updateAvailable && (
                        <div className="space-y-3">
                          <div className="p-4 bg-muted/10 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-primary" />
                              <span className="font-medium">{t('UpdateManager.NewRelease')}: {updateInfo.releaseInfo.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {t('UpdateManager.Published')}: {new Date(updateInfo.releaseInfo.publishedAt).toLocaleDateString()}
                            </p>
                            {updateInfo.releaseInfo.isPrerelease && (
                              <div className="mb-2">
                                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
                                  {t('UpdateManager.PreRelease')}
                                </span>
                              </div>
                            )}
                            {updateInfo.releaseInfo.body && (
                              <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                                {updateInfo.releaseInfo.body.split('\n').slice(0, 3).join('\n')}
                                {updateInfo.releaseInfo.body.split('\n').length > 3 && '...'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={checkForUpdates} 
                      disabled={checkingForUpdates}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${checkingForUpdates ? 'animate-spin' : ''}`} />
                      {checkingForUpdates ? t('UpdateManager.Checking') : t('UpdateManager.CheckForUpdates')}
                    </Button>
                    
                    {updateInfo?.updateAvailable && (
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(updateInfo.releaseInfo.htmlUrl, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t('UpdateManager.ViewRelease')}
                      </Button>
                    )}
                  </div>

                  {!updateInfo && !checkingForUpdates && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Click "{t('UpdateManager.CheckForUpdates')}" to verify your version</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 border-muted/20 shadow-sm">
              <CardHeader className="bg-muted/10 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-muted/20 p-2 rounded-full">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">{t('Settings.Notifications.Title')}</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-6">
                  {t('Settings.Notifications.Description')}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full h-11 flex items-center gap-2">
                        {t('Settings.Notifications.AddChannel')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>{t('Settings.Notifications.AddNotification.Title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4">
                            <Input
                              type="text"
                              id="notificationName"
                              placeholder={t('Settings.Notifications.AddNotification.Name')}
                              onChange={(e) => setNotificationName(e.target.value)}
                            />
                            <Select value={notificationType} onValueChange={(value: string) => setNotificationType(value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('Settings.Notifications.AddNotification.Type')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="smtp">{t('Settings.Notifications.AddNotification.SMTP.Title')}</SelectItem>
                              <SelectItem value="telegram">{t('Settings.Notifications.AddNotification.Telegram.Title')}</SelectItem>
                              <SelectItem value="discord">{t('Settings.Notifications.AddNotification.Discord.Title')}</SelectItem>
                              <SelectItem value="gotify">{t('Settings.Notifications.AddNotification.Gotify.Title')}</SelectItem>
                              <SelectItem value="ntfy">{t('Settings.Notifications.AddNotification.Ntfy.Title')}</SelectItem>
                              <SelectItem value="pushover">{t('Settings.Notifications.AddNotification.Pushover.Title')}</SelectItem>
                              <SelectItem value="echobell">{t('Settings.Notifications.AddNotification.Echobell.Title')}</SelectItem>
                            </SelectContent>

                            {notificationType === "smtp" && (
                              <div className="mt-4 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label>{t('Settings.Notifications.AddNotification.SMTP.Host')}</Label>
                                    <Input
                                      type="text"
                                      placeholder="smtp.example.com"
                                      onChange={(e) => setSmtpHost(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label>{t('Settings.Notifications.AddNotification.SMTP.Port')}</Label>
                                    <Input
                                      type="number"
                                      placeholder="587"
                                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 pt-2 pb-4">
                                  <Checkbox id="smtpSecure" onCheckedChange={(checked: any) => setSmtpSecure(checked)} />
                                  <Label htmlFor="smtpSecure" className="text-sm font-medium leading-none">
                                    {t('Settings.Notifications.AddNotification.SMTP.Secure')}
                                  </Label>
                                </div>

                                <div className="grid gap-4">
                                  <div className="space-y-1.5">
                                    <Label>{t('Settings.Notifications.AddNotification.SMTP.Username')}</Label>
                                    <Input
                                      type="text"
                                      placeholder="user@example.com"
                                      onChange={(e) => setSmtpUsername(e.target.value)}
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label>{t('Settings.Notifications.AddNotification.SMTP.Password')}</Label>
                                    <Input
                                      type="password"
                                      placeholder="••••••••"
                                      onChange={(e) => setSmtpPassword(e.target.value)}
                                    />
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <Label>{t('Settings.Notifications.AddNotification.SMTP.From')}</Label>
                                      <Input
                                        type="email"
                                        placeholder="noreply@example.com"
                                        onChange={(e) => setSmtpFrom(e.target.value)}
                                      />
                                    </div>

                                    <div className="space-y-1.5">
                                      <Label>{t('Settings.Notifications.AddNotification.SMTP.To')}</Label>
                                      <Input
                                        type="email"
                                        placeholder="admin@example.com"
                                        onChange={(e) => setSmtpTo(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {notificationType === "telegram" && (
                              <div className="mt-4 space-y-2">
                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Telegram.Token')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setTelegramToken(e.target.value)}
                                  />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Telegram.ChatId')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setTelegramChatId(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {notificationType === "discord" && (
                              <div className="mt-4">
                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Discord.Webhook')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setDiscordWebhook(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {notificationType === "gotify" && (
                              <div className="mt-4">
                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Gotify.Url')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setGotifyUrl(e.target.value)}
                                  />
                                  <div className="grid w-full items-center gap-1.5">
                                    <Label>{t('Settings.Notifications.AddNotification.Gotify.Token')}</Label>
                                    <Input
                                      type="text"
                                      onChange={(e) => setGotifyToken(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {notificationType === "ntfy" && (
                              <div className="mt-4">
                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Ntfy.Url')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setNtfyUrl(e.target.value)}
                                  />
                                  <div className="grid w-full items-center gap-1.5">
                                    <Label>{t('Settings.Notifications.AddNotification.Ntfy.Token')}</Label>
                                    <Input
                                      type="text"
                                      onChange={(e) => setNtfyToken(e.target.value)}
                                    />
                                  </div>                                
                                </div>  
                              </div>
                            )}

                            {notificationType === "pushover" && (
                              <div className="mt-4 flex flex-col gap-2">
                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Pushover.Url')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setPushoverUrl(e.target.value)}
                                  />
                                </div>

                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Pushover.Token')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setPushoverToken(e.target.value)}
                                  />
                                </div>

                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Pushover.User')}</Label>
                                  <Input
                                    type="text"
                                    onChange={(e) => setPushoverUser(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {notificationType === "echobell" && (
                              <div className="mt-4 flex flex-col gap-2">
                                <div className="grid w-full items-center gap-1.5">
                                  <Label>{t('Settings.Notifications.AddNotification.Echobell.Url')}</Label>
                                  <Input
                                    type="text"
                                    placeholder="e.g. https://hook.echobell.one/t/xxx"
                                    onChange={(e) => setEchobellURL(e.target.value)}
                                  />
                                </div>
                               <span className="text-xs text-muted-foreground">{t('Settings.Notifications.AddNotification.Echobell.AddMessage')}</span>
                              </div>
                            )}
                            
                          </Select>
                        </div>
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('Common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={addNotification}>{t('Common.add')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full h-11" variant="outline">
                        {t('Settings.Notifications.CustomizeText.Display')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>{t('Settings.Notifications.CustomizeText.Title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label>{t('Settings.Notifications.CustomizeText.Application')}</Label>
                            <Textarea
                              value={notificationTextApplication}
                              onChange={(e) => setNotificationTextApplication(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{t('Settings.Notifications.CustomizeText.Server')}</Label>
                            <Textarea
                              value={notificationTextServer}
                              onChange={(e) => setNotificationTextServer(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="pt-4 text-sm text-muted-foreground">
                            {t('Settings.Notifications.CustomizeText.Placeholders.Title')}
                            <ul className="list-disc list-inside space-y-1 pt-2">
                              <li>
                                <b>{t('Settings.Notifications.CustomizeText.Placeholders.Server.Title')}</b>
                                <ul className="list-disc list-inside ml-4 space-y-1 pt-1 text-muted-foreground">
                                  <li>{t('Settings.Notifications.CustomizeText.Placeholders.Server.Name')}</li>
                                  <li>{t('Settings.Notifications.CustomizeText.Placeholders.Server.Status')}</li>
                                </ul>
                              </li>
                              <li>
                                <b>{t('Settings.Notifications.CustomizeText.Placeholders.Application.Title')}</b>
                                <ul className="list-disc list-inside ml-4 space-y-1 pt-1 text-muted-foreground">
                                  <li>{t('Settings.Notifications.CustomizeText.Placeholders.Application.Name')}</li>
                                  <li>{t('Settings.Notifications.CustomizeText.Placeholders.Application.Url')}</li>
                                  <li>{t('Settings.Notifications.CustomizeText.Placeholders.Application.Status')}</li>
                                </ul>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('Common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={editNotificationText}>
                          {t('Common.Save')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">{t('Settings.Notifications.ActiveChannels')}</h3>
                  <div className="space-y-3">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card transition-all hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            {notification.type === "smtp" && (
                              <div className="bg-muted/20 p-2 rounded-full">
                                <AtSign className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            {notification.type === "telegram" && (
                              <div className="bg-muted/20 p-2 rounded-full">
                                <Send className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            {notification.type === "discord" && (
                              <div className="bg-muted/20 p-2 rounded-full">
                                <MessageSquare className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            {notification.type === "gotify" && (
                              <div className="bg-muted/20 p-2 rounded-full">
                                <Bell className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            {notification.type === "ntfy" && (
                              <div className="bg-muted/20 p-2 rounded-full">
                                <Bell className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            {notification.type === "pushover" && (
                              <div className="bg-muted/20 p-2 rounded-full">
                                <Bell className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="space-y-1">
                              <h3 className="font-medium capitalize">
                                {notification.name || 
                                  t(`Settings.Notifications.AddNotification.${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}.Title`)}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {t(`Settings.Notifications.AddNotification.${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}.Description`)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-muted/20"
                              onClick={() => testNotification(notification.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {t('Settings.Notifications.Test')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-muted/20"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {t('Settings.Notifications.Delete')}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border rounded-lg bg-muted/5">
                        <div className="flex justify-center mb-3">
                          <div className="bg-muted/20 p-3 rounded-full">
                            <Bell className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </div>
                        <h3 className="text-lg font-medium mb-1">
                          {t('Settings.Notifications.NoNotifications')}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {t('Settings.Notifications.NoNotificationsDescription')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Toaster />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}