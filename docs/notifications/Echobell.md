# Echobell Notification Setup

To enable Echobell notifications, you need the following:

- **Echobell Webhook URL**  
  The HTTP POST endpoint that Echobell exposes for your channel. You’ll find it in your channel’s **Integrations → Webhooks** section.

- **Message Field Key**  
  The JSON field name that Echobell expects for the notification text. By default this is `message`, but you can verify or customize it under **Integrations → Webhooks → Payload Settings**.

## How to get your Webhook URL and field key

1. **Log in** to your Echobell account.  
2. **Select the channel** you want to send notifications to.  
3. Navigate to **Integrations → Webhooks**.  
   - Copy the **Webhook URL** shown there (e.g., `https://api.echobell.one/hooks/abc123`).  
4. In the same screen, check **Payload Settings** and confirm the **Field Key** for your message (`message`).  
