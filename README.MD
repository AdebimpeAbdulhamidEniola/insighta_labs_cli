# Insighta Labs+ CLI

Command-line interface for the Insighta Labs+ platform. Supports GitHub OAuth login, profile querying, searching, creating, and exporting.

## Installation

```bash
git clone https://github.com/your-org/insighta-cli.git
cd insighta-cli
npm install
npm link          # makes `insighta` available globally
```

## Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
API_BASE_URL=https://your-backend-url.com
GITHUB_CLIENT_ID=your_github_client_id
CLI_CALLBACK_PORT=9876
```

> `GITHUB_CLIENT_ID` must match the OAuth App registered in your GitHub account. The callback URL registered in GitHub must include `http://localhost:9876/callback`.

## Usage

### Auth

```bash
insighta login          # Opens browser for GitHub OAuth
insighta logout         # Clears local session
insighta whoami         # Show logged-in user info
```

### Profiles

```bash
# List (with optional filters)
insighta profiles list
insighta profiles list --gender male
insighta profiles list --country NG --age-group adult
insighta profiles list --min-age 25 --max-age 40
insighta profiles list --sort-by age --order desc
insighta profiles list --page 2 --limit 20

# Get single profile
insighta profiles get <id>

# Natural language search
insighta profiles search "young males from nigeria"

# Create (admin only)
insighta profiles create --name "Harriet Tubman"

# Export to CSV (saved in current directory)
insighta profiles export --format csv
insighta profiles export --format csv --gender male --country NG
```

## Authentication Flow

1. `insighta login` generates a PKCE `state`, `code_verifier`, and `code_challenge`
2. A temporary local HTTP server starts on `localhost:9876`
3. Your browser opens GitHub's OAuth page
4. After you authorize, GitHub redirects to `http://localhost:9876/callback`
5. The CLI captures the `code`, validates `state`, then sends `code + code_verifier` to `POST /auth/cli/callback`
6. The backend exchanges the code with GitHub, creates/updates your user, and returns `access_token + refresh_token`
7. Tokens are stored at `~/.insighta/credentials.json` (mode 0600)

## Token Handling

- Access tokens expire in **3 minutes**
- Refresh tokens expire in **5 minutes**
- On any `401`, the CLI automatically attempts one token refresh before prompting re-login
- On logout, the refresh token is invalidated server-side

## Credentials Storage

```
~/.insighta/credentials.json
```

File permissions are set to `0600` (owner read/write only).