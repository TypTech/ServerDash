# ntfy Notification Setup

To enable ntfy notifications, you need the following:

- **ntfy URL**  
  The base URL of your ntfy server including the topic (e.g., `https://ntfy.example.com/alerts`)

- **ntfy Token**  
  An access token for authentication, generated per user

## How to get the ntfy URL and Token

1. **Install and set up your ntfy server** (self-hosted or use `https://ntfy.sh`)
2. **Choose a topic name** (e.g. `alerts`) and include it in the URL:  
   `https://<your-ntfy-server>/<your-topic>`

3. **Create a user (if not already created)**

4. **Generate a token for the user** using the following command:  
   ```bash
   ntfy token add --expires=30d --label="notifications" <username>
   ```

5. **List existing tokens** to get the full token string:  
   ```bash
   ntfy token list <username>
   ```

6. **Use the token** as a bearer token when sending messages, either in the Authorization header or in your tool's configuration.

## Example Token Management Commands

```bash
ntfy token list                       # Show all tokens
ntfy token list alice                 # Show tokens for user 'alice'
ntfy token add alice                  # Create token for user 'alice' (never expires)
ntfy token add --expires=2d bob       # Create token for 'bob', expires in 2 days
ntfy token remove alice tk_...        # Delete a token
```

More information at [the ntfy docs](https://docs.ntfy.sh/config/#access-tokens)