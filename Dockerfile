FROM caddy:2-alpine

WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html /srv/
COPY images/ /srv/images/

EXPOSE 80
