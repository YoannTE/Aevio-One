FROM caddy:2-alpine

WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html /srv/
COPY robots.txt /srv/
COPY sitemap.xml /srv/
COPY images/ /srv/images/

EXPOSE 80
