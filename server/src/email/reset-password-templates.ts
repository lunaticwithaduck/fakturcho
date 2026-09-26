import type { Locale } from './locale';

interface ResetPasswordEmailContent {
  subject: string;
  text: string;
}

const TEMPLATES: Record<Locale, (url: string) => ResetPasswordEmailContent> = {
  bg: (url) => ({
    subject: 'Смяна на паролата за Фактурчо',
    text: `Получихме заявка за смяна на паролата на профила ви във Фактурчо.\n\nЗа да зададете нова парола, отворете тази връзка:\n${url}\n\nАко не сте заявили това, можете спокойно да пренебрегнете това съобщение.`,
  }),
  en: (url) => ({
    subject: 'Reset your Fakturcho password',
    text: `We received a request to reset the password for your Fakturcho account.\n\nTo set a new password, open this link:\n${url}\n\nIf you didn't ask for this, you can safely ignore this email.`,
  }),
  de: (url) => ({
    subject: 'Setzen Sie Ihr Fakturcho-Passwort zurück',
    text: `Wir haben eine Anfrage erhalten, das Passwort für Ihr Fakturcho-Konto zurückzusetzen.\n\nUm ein neues Passwort festzulegen, öffnen Sie diesen Link:\n${url}\n\nWenn Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren.`,
  }),
  fr: (url) => ({
    subject: 'Réinitialisez votre mot de passe Fakturcho',
    text: `Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Fakturcho.\n\nPour définir un nouveau mot de passe, ouvrez ce lien :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.`,
  }),
  it: (url) => ({
    subject: 'Reimposta la tua password Fakturcho',
    text: `Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account Fakturcho.\n\nPer impostare una nuova password, apri questo link:\n${url}\n\nSe non hai richiesto tu questa operazione, puoi ignorare questa email.`,
  }),
  pl: (url) => ({
    subject: 'Zresetuj hasło do Fakturcho',
    text: `Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta Fakturcho.\n\nAby ustawić nowe hasło, otwórz ten link:\n${url}\n\nJeśli to nie Ty wysłałeś tę prośbę, możesz zignorować tę wiadomość.`,
  }),
  ro: (url) => ({
    subject: 'Resetează-ți parola Fakturcho',
    text: `Am primit o solicitare de resetare a parolei pentru contul tău Fakturcho.\n\nPentru a seta o parolă nouă, deschide acest link:\n${url}\n\nDacă nu ai solicitat această acțiune, poți ignora acest e-mail.`,
  }),
};

export function buildResetPasswordEmail(locale: Locale, url: string): ResetPasswordEmailContent {
  return TEMPLATES[locale](url);
}
