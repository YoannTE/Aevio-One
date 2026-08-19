FROM caddy:2-alpine

WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html /srv/
COPY robots.txt /srv/
COPY sitemap.xml /srv/
COPY images/ /srv/images/
COPY js/ /srv/js/
COPY docs/ /srv/docs/
COPY aevio-agents/ /srv/aevio-agents/
COPY assistant-commercial/ /srv/assistant-commercial/

EXPOSE 80
