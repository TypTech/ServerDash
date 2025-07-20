# Pushover Notification Setup

To enable Pushover notifications, you need the following:

- **Pushover URL**  
  The API endpoint for sending messages:  
  `https://api.pushover.net/1/messages.json`

- **Pushover Token**  
  Your application’s API token (generated in your Pushover dashboard)

- **Pushover User Key**  
  The user key or group key of the recipient (found in your Pushover account)

## How to get the URL, Token, and User Key

1. **Sign up or log in** at the Pushover website.
2. **Create a new application** under “Your Applications.”  
   - You will receive your **Pushover Token** here.
3. **Locate your User Key** on your account’s main page.  
   - If you want to notify a group, create or use an existing **Group Key** instead.
4. **Use the API URL** `https://api.pushover.net/1/messages.json`