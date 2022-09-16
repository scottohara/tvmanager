# syntax=docker/dockerfile:1

ARG NODE_VERSION
ARG RUBY_VERSION

### Frontend ###

FROM node:${NODE_VERSION}-alpine as frontend

ARG NPM_VERSION
RUN --mount=type=cache,id=tvmanager-npm,target=/root/.npm \
	npm install --global npm@$NPM_VERSION

WORKDIR /build

COPY --link package*.json ./

RUN --mount=type=cache,id=tvmanager-npm,target=/root/.npm \
	npm ci

COPY --link \
	tsconfig.json \
	webpack.common.js \
	webpack.prod.js ./

COPY --link src src/

RUN npm run build

### Backend ###

FROM ruby:${RUBY_VERSION}-alpine as backend

RUN apk add --no-cache build-base

WORKDIR /build
ENV RACK_ENV=production

COPY --link Gemfile* ./

RUN --mount=type=cache,id=tvmanager-bundler,target=tmp/vendor/bundle \
	bundle config set --local without development:test; \
	bundle config set --local deployment true; \
	bundle config set --local clean true;\
	bundle config set --local path tmp/vendor/bundle; \
	bundle install --jobs=4; \
	cp -a tmp/vendor ./;

### App ###

FROM ruby:${RUBY_VERSION}-alpine as app

RUN adduser --system tvmanager
USER tvmanager
WORKDIR /tvmanager
ENV RACK_ENV=production

RUN \
	bundle config set --local without development:test; \
	bundle config set --local deployment true;

COPY --link --chown=tvmanager \
	config.ru \
	Gemfile* \
	Rakefile ./

COPY --link --chown=tvmanager db db/
COPY --link --chown=tvmanager config config/
COPY --link --chown=tvmanager app app/
COPY --link --chown=tvmanager --from=backend build/vendor/bundle vendor/bundle/
COPY --link --chown=tvmanager --from=frontend build/public public/

EXPOSE 3000

CMD ["bundle", "exec", "puma"]