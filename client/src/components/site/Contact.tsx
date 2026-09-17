import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Command,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { track } from "@/lib/analytics";
import {
  attributionSource,
  buildMailtoFallback,
  getAttribution,
  submitLead,
  type LeadPayload,
} from "@/lib/leads";
import { brand, finalCta, primaryCta } from "@/content/site";

type Fields = {
  name: string;
  contact: string;
  task: string;
  link: string;
  company_website: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  name: "",
  contact: "",
  task: "",
  link: "",
  company_website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM_RE =
  /^(@[a-zA-Z0-9_]{4,}|(https?:\/\/)?t\.me\/[a-zA-Z0-9_+]{4,})$/;
const PHONE_RE = /^\+?[\d\s()-]{7,}$/;

function validate(values: Fields): Errors {
  const errors: Errors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Укажите имя — так понятно, к кому обращаться.";
  }

  const contact = values.contact.trim();
  if (!contact) {
    errors.contact = "Нужен email или Telegram, чтобы ответить.";
  } else if (
    !EMAIL_RE.test(contact) &&
    !TELEGRAM_RE.test(contact) &&
    !PHONE_RE.test(contact)
  ) {
    errors.contact =
      "Похоже на опечатку. Например: name@company.ru или @username.";
  }

  if (values.task.trim().length < 15) {
    errors.task =
      "Пары слов о процессе достаточно, но не меньше — иначе нечего разбирать.";
  }

  return errors;
}

export default function Contact() {
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "fallback">(
    "idle"
  );
  const [startedTracked, setStartedTracked] = useState(false);
  const mountedAt = useRef(Date.now());
  const [fallbackHref, setFallbackHref] = useState("");

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const payload = useMemo<LeadPayload>(
    () => ({
      name: values.name.trim(),
      contact: values.contact.trim(),
      task: values.task.trim(),
      link: values.link.trim() || undefined,
      company_website: values.company_website,
      elapsedMs: Date.now() - mountedAt.current,
      attribution: getAttribution(),
      page: typeof window === "undefined" ? "" : window.location.href,
    }),
    [values]
  );

  const setField =
    (field: keyof Fields) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues(current => ({ ...current, [field]: value }));
      // Clear the error as soon as the visitor starts fixing it — input is never reset.
      setErrors(current =>
        current[field] ? { ...current, [field]: undefined } : current
      );

      if (!startedTracked) {
        setStartedTracked(true);
        track("contact_start", {
          section: "contact",
          source: attributionSource(),
        });
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(`field-${firstField}`)?.focus();
      return;
    }

    setState("sending");
    const result = await submitLead(payload);

    if (result.ok) {
      setState("sent");
      track("contact_submit", {
        section: "contact",
        source: attributionSource(payload.attribution),
      });
      return;
    }

    if (result.reason === "not_configured" || result.reason === "network") {
      setFallbackHref(buildMailtoFallback(payload, brand.email));
      setState("fallback");
      return;
    }

    setState("idle");
    setErrors({
      task:
        result.reason === "rate_limited"
          ? "Слишком много отправок подряд. Подождите минуту или напишите нам напрямую."
          : "Не получилось отправить. Проверьте поля или напишите нам напрямую.",
    });
  };

  return (
    <section id="contact" className="contact section-pad">
      <div className="contact-signal" aria-hidden="true">
        <div className="signal-ring ring-a" />
        <div className="signal-ring ring-b" />
        <div className="signal-core">
          <Command size={25} strokeWidth={1.1} />
        </div>
      </div>
      <div className="section-heading reveal">
        <span className="section-index">// 09</span>
        <span className="mono">РАЗОБРАТЬ ЗАДАЧУ / CONTACT</span>
        <span className="heading-note">{finalCta.responseNote}</span>
      </div>
      <div className="contact-layout">
        <div className="contact-title reveal">
          <h2 className="display">
            {finalCta.titleStart}
            <br />
            <em>{finalCta.titleAccent}</em>
          </h2>
          <p className="contact-subline">{finalCta.titleEnd}</p>
          <p>{finalCta.description}</p>
          <div className="contact-links">
            <a
              href={`mailto:${brand.email}`}
              onClick={() => track("email_click", { section: "contact" })}
            >
              <Mail size={17} aria-hidden="true" /> {brand.email}
            </a>
            <a
              href={brand.telegramUrl}
              onClick={() => track("telegram_click", { section: "contact" })}
            >
              <Send size={17} aria-hidden="true" /> Telegram / {brand.telegram}
            </a>
          </div>
        </div>

        {state === "sent" ? (
          <div className="contact-form reveal delay-1 form-done" role="status">
            <span className="mono">ЗАЯВКА ПРИНЯТА</span>
            <h3>Спасибо — мы получили ваш контекст.</h3>
            <p>
              Ответим на {payload.contact} в течение 1–2 рабочих дней. В первом
              письме зададим несколько вопросов о процессе, чтобы разговор был
              предметным.
            </p>
            <p className="form-note">
              Если ответа не будет — напишите напрямую в Telegram{" "}
              {brand.telegram}.
            </p>
          </div>
        ) : (
          <form
            className="contact-form reveal delay-1"
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="field-name">
              <span className="mono">01 / КАК ВАС ЗОВУТ</span>
              <input
                id="field-name"
                name="name"
                value={values.name}
                onChange={setField("name")}
                placeholder="Имя и компания"
                autoComplete="organization"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "error-name" : undefined}
              />
              {errors.name && (
                <span className="field-error mono" id="error-name">
                  {errors.name}
                </span>
              )}
            </label>

            <label htmlFor="field-contact">
              <span className="mono">02 / КУДА ОТВЕТИТЬ</span>
              <input
                id="field-contact"
                name="contact"
                value={values.contact}
                onChange={setField("contact")}
                placeholder="you@company.ru или @username"
                autoComplete="email"
                aria-invalid={Boolean(errors.contact)}
                aria-describedby={errors.contact ? "error-contact" : undefined}
              />
              {errors.contact && (
                <span className="field-error mono" id="error-contact">
                  {errors.contact}
                </span>
              )}
            </label>

            <label htmlFor="field-task">
              <span className="mono">03 / ЧТО ПРОИСХОДИТ</span>
              <textarea
                id="field-task"
                name="task"
                value={values.task}
                onChange={setField("task")}
                placeholder="Как сейчас приходят заявки, где теряется время, какие системы уже используете"
                rows={3}
                aria-invalid={Boolean(errors.task)}
                aria-describedby={errors.task ? "error-task" : undefined}
              />
              {errors.task && (
                <span className="field-error mono" id="error-task">
                  {errors.task}
                </span>
              )}
            </label>

            <label htmlFor="field-link">
              <span className="mono">04 / САЙТ ИЛИ ССЫЛКА — НЕОБЯЗАТЕЛЬНО</span>
              <input
                id="field-link"
                name="link"
                value={values.link}
                onChange={setField("link")}
                placeholder="company.ru"
                autoComplete="url"
              />
            </label>

            {/* Honeypot: invisible to people, irresistible to bots. */}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="field-company-website">
                Не заполняйте это поле
              </label>
              <input
                id="field-company-website"
                name="company_website"
                value={values.company_website}
                onChange={setField("company_website")}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              className="button button-primary magnetic"
              type="submit"
              disabled={state === "sending"}
            >
              {state === "sending" ? (
                <>
                  Отправляем{" "}
                  <Loader2 size={18} className="spin" aria-hidden="true" />
                </>
              ) : (
                <>
                  {primaryCta} <ArrowUpRight size={18} aria-hidden="true" />
                </>
              )}
            </button>

            {state === "fallback" && (
              <p className="form-fallback" role="status">
                <Check size={14} aria-hidden="true" /> Форма не смогла
                отправиться автоматически.{" "}
                <a href={fallbackHref}>Открыть письмо с вашим текстом</a> или
                написать в <a href={brand.telegramUrl}>Telegram</a>.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
