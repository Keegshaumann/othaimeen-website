# othaimeengrp.com DNS, as served by Effentii (17 Nov 2026)

Read from `ns1.servconfig.com` on 17 Nov 2026. Zone transfer (AXFR) is refused, so names were found by
querying common names, certificate logs and the nginx config on the BOG VPS (187.127.224.214).
Before switching nameservers, compare against an export from the BOG cPanel Zone Editor in case a
record was missed.

Registrar: PDR Ltd (PublicDomainRegistry), Effentii's reseller account. Expires 13 Sep 2027.
Status `ok` (unlocked) since 16 Nov 2026 15:02 UTC. Registrant: Troy Geldart, tageldart@pm.me
(must be changed to BOG once the domain is in BOG's Porkbun account). DNSSEC: off.

## Records to recreate at Porkbun

| Name | Type | Value | Notes |
|---|---|---|---|
| @ | A | 216.194.167.167 | Old WordPress site. Change to the new host's IP at cut-over |
| www | CNAME | othaimeengrp.com | |
| crm | A | 187.127.224.214 | EspoCRM on the BOG VPS (keep) |
| erp | A | 187.127.224.214 | ERPNext on the BOG VPS (keep) |
| pim | A | 187.127.224.214 | Medusa PIM on the BOG VPS (keep) |
| portal | A | 187.127.224.214 | BOG VPS (keep) |
| webhook | A | 187.127.224.214 | Agent webhooks on the BOG VPS (keep) |
| @ | MX 10 | res354.servconfig.com | Effentii mail. Change when mail moves |
| mail | CNAME | othaimeengrp.com | Mail clients use mail.othaimeengrp.com; repoint with MX |
| webmail, autoconfig, autodiscover | A | 216.194.167.167 | Effentii mail. Change when mail moves |
| @ | TXT | `v=spf1 +a +mx +ip4:216.194.167.167 include:relay.mailchannels.net -all` | Hard fail (`-all`). Must include the new web host and mail provider before either sends |
| _dmarc | TXT | `v=DMARC1;p=quarantine;sp=none;adkim=r;aspf=r;pct=100;fo=0;rf=afrf;ri=86400;rua=mailto:dmarc@othaimeengrp.com;ruf=mailto:dmarc@othaimeengrp.com` | Keep |
| default._domainkey | TXT | (cPanel DKIM key, copy verbatim from the live zone) | Effentii's signing key. Remove after 25 Nov |
| _mailchannels | TXT | `v=mc1 auth=inmotionhosting` | Needed while mail still leaves via Effentii. Remove after 25 Nov |
| _autodiscover._tcp | SRV | 0 0 443 cpanelemaildiscovery.cpanel.net | cPanel. Drop when mail moves |

## Records to drop (cPanel/Effentii only)

`cpanel`, `whm`, `webdisk`, `ftp`, `cpcalendars`, `cpcontacts` (all A 216.194.167.167),
`_caldav(s)._tcp` / `_carddav(s)._tcp` SRV, `_cpanel-dcv-test-record` TXT, `_acme-challenge` TXT,
and `chuckecheesethemeparkrp` / `www.chuckecheesethemeparkrp` (an unexplained cPanel subdomain with its
own SPF; not BOG's business as far as we know, so not carried over unless Abdul says otherwise).
