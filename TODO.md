# BoincHub TODO

## Immediate

- Convert to DevBox
- Finish other norms points
- Add CHANGELOG
- Release

## Fixes

- Add toasts in appropriate spots (failed deletions and maybe more)
- Rebuild any React components that currently suppress cascading render errors.

## Features

### Logic

- Detach when done may need to send a standard detach signal as well.
- Investigate a solution for only sending changed projects, presumably using a
  state hash. The problem is that opaque data is global, whereas we need a
  per-project solution.

### BOINC Features

- Actually do something with some of the other parameters newer BOINC clients
  send. (See AccountManagement.md)
- Investigate nullable resource share.
- Support abort_not_started

### Wish List

- It would be nice for the admin interface to verify the signed URL.
- Need to figure out the appropriate pattern. Who is responsible for figuring
  out if things exist, the service or the API endpoints?
- Eventually, look into hashing the password locally and sending the hash, if
  possible.
- Could go for more security options like advanced rate limiting and account/IP
  lockouts.
- Consider changing the default port to match the Dockerfile or vice versa.

## Phase 3

- Add reporting/statistics views

## General Notes

- Implement proper rate limiting
- Add request validation
- Unit tests for core functionality
- Integration tests with BOINC client
- UI testing
- API documentation
- User guide
- Admin guide
- Development guide
- Email notifications
- Advanced statistics
- Computer groups
- Team management

## Audit Results

- Enhanced rate limiting, investigate limiter
- Weak Password Requirements - No password strength validation
- No Account Lockout - No protection against brute force attacks
- Missing 2FA - No two-factor authentication support

- Missing Transaction Management
- No Repository Pattern - Consider adding a repository layer for better testability.
- Missing Global Exception Handler
- N+1 Query Problem in ComputersPage.tsx (when fetching attachments)
- No Loading/Error States in some components
- Add Database Indexes
- Implement Pagination
- Add Caching for frequently accessed data like projects list
- Frontend Bundle Optimization
- Add pytest for backend
- Add Jest/React Testing Library for frontend
- Add Playwright for E2E tests
- Structured logging with proper log levels
- Application metrics (Prometheus)
- Error tracking (Sentry)
- Docker/docker-compose setup
- Environment-specific configurations
- Add Input Validation
- Implement URL signing verification
- Handle weak vs strong authenticators properly
- Add optimistic updates for better UX
- Implement proper cache invalidation
- Pre-commit hooks for linting
- Hot reloading for development
- API mocking for frontend development
