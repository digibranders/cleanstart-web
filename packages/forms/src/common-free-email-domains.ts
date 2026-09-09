/**
 * The consumer webmail providers a real visitor is actually likely to type,
 * curated for global coverage (Americas, Europe, India, China, Japan, Korea,
 * Russia, Brazil, Middle East).
 *
 * This is the client-side list. It exists so the inline error appears the
 * instant someone blurs the email field, with no network round trip and
 * without shipping the full 13,797-domain corpus (63 KB brotli, which would
 * make it the largest asset on the site).
 *
 * It is deliberately a subset, not a duplicate: the authoritative gate is
 * FREE_EMAIL_DOMAINS on the server. A domain in the long tail passes here and
 * is rejected at the API boundary, which the form surfaces on the same field.
 * `common-free-email-domains.test.ts` asserts every entry below is also in the
 * full list, so the two can never contradict each other.
 */

export const COMMON_FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  // Google
  'gmail.com', 'googlemail.com',
  // Microsoft
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
  'hotmail.es', 'hotmail.be', 'hotmail.nl', 'hotmail.ca', 'hotmail.com.au',
  'hotmail.com.br', 'hotmail.co.jp', 'hotmail.co.th', 'hotmail.sg',
  'outlook.com', 'outlook.co.id', 'outlook.com.au', 'outlook.com.br',
  'outlook.de', 'outlook.dk', 'outlook.es', 'outlook.fr', 'outlook.ie',
  'outlook.in', 'outlook.it', 'outlook.jp', 'outlook.pt', 'outlook.sa',
  'live.com', 'live.co.uk', 'live.ca', 'live.com.au', 'live.de', 'live.fr',
  'live.it', 'live.nl', 'live.se', 'live.dk', 'live.no', 'live.cn',
  'msn.com', 'passport.com', 'windowslive.com',
  // Yahoo
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'yahoo.in', 'yahoo.ca',
  'yahoo.com.au', 'yahoo.com.br', 'yahoo.com.mx', 'yahoo.com.ar',
  'yahoo.com.sg', 'yahoo.com.hk', 'yahoo.com.ph', 'yahoo.com.vn',
  'yahoo.co.jp', 'yahoo.co.kr', 'yahoo.co.id', 'yahoo.co.nz', 'yahoo.de',
  'yahoo.fr', 'yahoo.es', 'yahoo.it', 'yahoo.se', 'yahoo.dk', 'yahoo.no',
  'yahoo.pl', 'yahoo.gr', 'yahoo.ie', 'ymail.com', 'rocketmail.com',
  // AOL / Verizon
  'aol.com', 'aol.co.uk', 'aol.de', 'aol.fr', 'aim.com', 'verizon.net',
  // Apple
  'icloud.com', 'me.com', 'mac.com',
  // Privacy-focused
  'protonmail.com', 'protonmail.ch', 'proton.me', 'pm.me', 'tutanota.com',
  'tutanota.de', 'tutamail.com', 'tuta.io', 'hushmail.com', 'duck.com',
  'fastmail.com', 'fastmail.fm', 'posteo.de', 'mailbox.org', 'runbox.com',
  'startmail.com', 'mailfence.com', 'disroot.org', 'riseup.net',
  // Generic / ISP webmail
  'mail.com', 'email.com', 'usa.com', 'consultant.com', 'inbox.com',
  'gmx.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 'gmx.fr', 'gmx.es',
  'web.de', 't-online.de', 'freenet.de', 'arcor.de', 'zoho.com', 'zohomail.com',
  'aim.co.uk', 'btinternet.com', 'sky.com', 'talktalk.net', 'virginmedia.com',
  'ntlworld.com', 'blueyonder.co.uk', 'comcast.net', 'sbcglobal.net',
  'att.net', 'bellsouth.net', 'cox.net', 'charter.net', 'earthlink.net',
  'juno.com', 'optonline.net', 'roadrunner.com', 'rogers.com', 'shaw.ca',
  'sympatico.ca', 'telus.net', 'videotron.ca', 'bigpond.com', 'bigpond.net.au',
  'optusnet.com.au', 'iinet.net.au', 'xtra.co.nz',
  // France / Italy / Spain / Portugal / Nordics / NL / PL
  'orange.fr', 'wanadoo.fr', 'free.fr', 'laposte.net', 'sfr.fr', 'neuf.fr',
  'bbox.fr', 'libero.it', 'virgilio.it', 'tiscali.it', 'alice.it', 'tin.it',
  'terra.com', 'terra.com.br', 'telefonica.net', 'ono.com', 'sapo.pt',
  'telenet.be', 'skynet.be', 'ziggo.nl', 'kpnmail.nl', 'home.nl', 'planet.nl',
  'telia.com', 'bredband.net', 'online.no', 'broadpark.no', 'sol.dk',
  'mail.dk', 'wp.pl', 'o2.pl', 'onet.pl', 'interia.pl', 'gazeta.pl',
  'seznam.cz', 'centrum.cz', 'freemail.hu', 'citromail.hu',
  // Russia / Ukraine / Turkey
  'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru', 'internet.ru', 'yandex.com',
  'yandex.ru', 'yandex.ua', 'yandex.kz', 'ya.ru', 'rambler.ru', 'ukr.net',
  'meta.ua', 'i.ua', 'mynet.com',
  // China / Taiwan / Hong Kong
  'qq.com', 'foxmail.com', '163.com', '126.com', 'yeah.net', 'sina.com',
  'sina.cn', 'sohu.com', '21cn.com', 'aliyun.com', 'tom.com', '139.com',
  'hotmail.com.hk', 'pchome.com.tw', 'yahoo.com.tw',
  // Japan / Korea
  'docomo.ne.jp', 'ezweb.ne.jp', 'softbank.ne.jp', 'nifty.com', 'excite.co.jp',
  'naver.com', 'daum.net', 'hanmail.net', 'nate.com', 'korea.com',
  // India
  'rediffmail.com', 'rediff.com', 'indiatimes.com', 'sify.com', 'in.com',
  // Brazil / LatAm
  'uol.com.br', 'bol.com.br', 'ig.com.br', 'globo.com', 'globomail.com',
  'r7.com', 'oi.com.br', 'zipmail.com.br', 'hotmail.com.mx', 'prodigy.net.mx',
  // Middle East / Africa
  'maktoob.com', 'walla.com', 'walla.co.il', 'nana10.co.il', 'webmail.co.za',
  'vodamail.co.za', 'mweb.co.za', 'yahoo.co.za',
  // Throwaway services people reach for on a demo form
  'mailinator.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'trashmail.com', 'throwawaymail.com',
  'yopmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc',
  'fakeinbox.com', 'mintemail.com', 'spamgourmet.com', 'mailnesia.com',
]);
