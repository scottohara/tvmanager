# Commands

## Backend

- Linting - `bundle exec rubocop`
- Run tests - `npm run rspec`
- Start database - `npm run db`
- Start server - `npm run api`
- Start server (test environment) - `npm run api:test`

Generally you'll want to use `npm run test:backend` which concurrently runs:

- `npm run db`
- `npm run rspec`

## Frontend

- Check formatting - `npm run format:check`
- Reformat - `npm run format`
- Linting - `npm run lint`
- Run tests - `npm run test:coverage:chrome`
- Start dev server - `npm run ui`
- Build - `npm run build`

## Full stack

- E2E tests (Cypress) - `npm run test:e2e`

Generally you'll want to use `npm start` which concurrently runs:

- `npm run api`
- `npm run db`
- `npm run ui`

# Stack

- Postgres
- Ruby on Rails (API mode)
- Vanilla Typescript + CSS
- Rspec, FactoryBot, Rubocop
- Karma, Mocha, Sinon, Chai, ESLint, Prettier
- Cypress
- Webpack

# Architecture

- PWA primarily targeting mobile screen sizes
- Frontend is a custom MVC-style framework
- Uses a "view stack" metaphor where navigating to a new view pushes it onto the stack, navigating back pops the stack revealing the previous view underneath
- Single-user, after login credentials are stored in local storage and passed as basic auth in every API call

# Structure

## Backend

- Conventional Rails layout (`/app`, `/config`, `/spec`, etc.)

## Frontend

- `/src/models` - domain models
- `/src/views` - HTML templates for views
- `/src/controllers` - view controllers, provides navigation and view specific logic
- `/src/stylesheets` - global CSS
- `/src/services` - API client
- `/src/components` - reusable UI components

# Conventions

- NEVER deploy
- 100% line/branch/function test coverage for both backend and frontend
- All observable effects of a function (including private ones) should have assertions.
- Examples of "observable effects" are return values, nested function calls, mutations visible outside of the scope of the function under test, HTTP requests, file operations etc.
- Code comments should not describe _what_ the code does, but _why_ it does it. Use comments sparingly and only where necessary. Follow established conventions for when a comment might be useful
