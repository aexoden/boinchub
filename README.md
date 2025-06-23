# BoincHub

`boinchub` is a simple BOINC account manager primarily intended for personal use.
It provides a web-based interface for managing BOINC projects, computers, and
user accounts with support for multiple users and basic role-based permissions.

## Important Note

While I use this project for my own personal use, I make no guarantees about its
stability or usefulness. While I am attempting to maintain a database upgrade
path, I can't guarantee one will always be available. The API itself should not
be considered stable.

As this project has basic functionality for my needs, future development may be
slow or nonexistent, but I am happy to look at well-written pull requests.

## Features

- **BOINC Account Management**: Basic implementation of the BOINC account
    manager protocol
- **Web Interface**: Modern React-based frontend with TypeScript and TailwindCSS
- **Multi-user Support**: Supports multiple users with basic role-based permissions
- **Project Management**: Add, configure, and manage BOINC projects
- **Computer Management**: Track and configure BOINC clients
- **Resource Control**: Fine-grained control over CPU/GPU usage
- **Preference Groups**: Manage global BOINC preferences and assign computers
- **Admin CLI**: Basic admin CLI for user administration

## Architecture

- **Backend**: FastAPI (Python 3.13+) with SQLModel
- **Frontend**: React 19 with TypeScript, TailwindCSS, and Tanstack Query
- **Database**: PostgreSQL (recommended), but SQLite may still work (not tested)
- **Authentication**: JWT-based with refresh tokens

## Prerequisites

- Python 3.13 or higher
- [uv](https://github.com/astral-sh/uv)
- Node.js 18+ with pnpm
- PostgreSQL
- BOINC crypt_prog utility (for signing key generation and signing project URLs)

## Installation & Development Setup

After cloning the repository, you will find the backend and frontend in separate
directories.

### Environment

Copy the `.env.template` to `.env` and configure to your liking. You'll need to
create a database on your own.

### Backend

```bash
cd backend
uv run alembic upgrade head
uv run boinchub
```

### Frontend

```bash
cd frontend
pnpm run dev
```

By default, you can access the frontend at `http://localhost:8501`, and the API
runs on port 8500.

## BOINC Key Setup

BoincHub requires a BOINC signing key to authenticate project URLs. Generate this
using BOINC's [`crypt_prog` utility](https://github.com/BOINC/boinc/wiki/KeySetup).
You will need to configure your public key in the environment and sign any project
URLs you add to the database.

## Production Deployment

BoincHub includes a Dockerfile for docker-based deployment. However, it is only
tested using [Dokku](https://dokku.com). The following is a rough guide on what
needs to happen:

You will need Dokku installed and configured with the PostgreSQL and LetsEncrypt
plugins installed.

```bash
dokku apps:create boinchub
dokku postgres:create boinchub
dokku postgres:link boinchub boinchub --alias BOINCHUB_DATABASE
dokku config:set boinchub BOINCHUB_ENVIRONMENT=production
dokku config:set boinchub BOINCHUB_SECRET_KEY=$(openssl rand -hex 32)
dokku config:set boinchub BOINCHUB_MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)
dokku config:set boinchub BOINCHUB_BACKEND_URL=https://your.domain.com
dokku config:set boinchub BOINCHUB_FRONTEND_URL=https://your.domain.com
dokku config:set boinchub BOINCHUB_ACCOUNT_MANAGER_NAME="Your Account Manager Name"
dokku config:set boinchub BOINCHUB_PUBLIC_KEY="$(cat boinc_public_key)"
dokku config:set boinchub BOINCHUB_PORT=8000
dokku config:set boinchub BOINCHUB_HOST=0.0.0.0
```

You can additionally set any other settings you want to change the defaults from.
See .env.template for details.

On your local machine, you'll need to push the application:

```bash
git remote add dokku dokku@your-server:boinchub
git push dokku main
```

Back on the server, there are still a few things to do.

```bash
dokku ports:add boinchub http:80:8000
dokku letsencrypt:set boinchub email your@email.com
dokku letsencrypt:enable boinchub
dokku enter boinchub
uv run boinchub-admin create-admin your-username your@email.com
```

## Contributing

I'm generally happy to look at well-written pull requests. I'm not entirely happy
with the structure of either the backend or the frontend. If I were starting
over, I would probably not use FastAPI (or even Python). The frontend probably
needs a rewrite as well. I'm still fairly new to React.

## License

`boinchub` is distributed under the terms of the [MIT](https://spdx.org/licenses/MIT.html)
license.
