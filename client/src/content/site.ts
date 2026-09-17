import type { NavItem, OutcomeCard } from "./types";

export const brand = {
  name: "Digital Modus Operandi",
  short: "DMO",
  /** Secondary brand line. Never the main offer. */
  tagline: "Делаем сложное понятным.",
  email: "hello@dmo.agency",
  telegram: "@dmo_agency",
  telegramUrl: "https://t.me/dmo_agency",
  location: "Кишинёв / Комрат / remote",
  /**
   * OPEN QUESTION for the client: is the slot counter a real constraint?
   * Left untouched until confirmed — see DMO_REWORK_PROGRESS.md §4.
   */
  availableSlots: "02",
};

/** Single CTA wording across the whole site. */
export const primaryCta = "Разобрать задачу";
export const secondaryCta = "Смотреть кейсы";

export const navItems: NavItem[] = [
  { label: "Задачи", href: "#problems" },
  { label: "Что разрабатываем", href: "#services" },
  { label: "Кейсы", href: "#cases" },
  { label: "Как работаем", href: "#process" },
  { label: "Команда", href: "#team" },
  { label: "Вопросы", href: "#faq" },
  { label: "Контакты", href: "#contact" },
];

export const hero = {
  eyebrow: "B2B WEB SYSTEMS / AUTOMATION / E-COMMERCE",
  titleStart: "B2B-системы,",
  titleAccent: "которые забирают",
  titleEnd: "часть продаж на себя.",
  description:
    "Разрабатываем B2B-сайты, каталоги, личные кабинеты и внутренние системы. Интегрируем их с CRM, ERP, складом и другими сервисами бизнеса.",
};

export const marqueeWords = [
  "b2b-сайты",
  "каталоги",
  "личные кабинеты",
  "crm-системы",
  "интеграции",
  "автоматизация",
];

export const problems = {
  title: "Продажи растут.",
  titleAccent: "Ручной работы — ещё больше.",
  lead: "Если клиент звонит менеджеру, чтобы узнать цену, остаток, получить документ или проверить статус заказа — ваш digital пока не работает как система.",
  support:
    "Менеджеры пересылают прайсы, сверяют остатки и вручную переносят заявки в учётную систему. Сайт живёт отдельно от CRM, склада и бухгалтерии.",
  cards: [
    {
      code: "01 / LESS MANUAL WORK",
      title: "Меньше ручных операций",
      text: "Клиент сам находит товар, видит условия и отправляет заказ без переписки с менеджером.",
    },
    {
      code: "02 / FASTER DEALS",
      title: "Быстрее сделки",
      text: "Цены, наличие, документы и статусы доступны там, где клиент их ожидает — в интерфейсе.",
      accent: true,
    },
    {
      code: "03 / ONE SYSTEM",
      title: "Больше контроля",
      text: "Сайт, CRM и внутренние процессы перестают жить отдельно и начинают работать как одна система.",
    },
  ] satisfies OutcomeCard[],
};

export const finalCta = {
  titleStart: "Покажите, как сейчас",
  titleAccent: "работает ваш процесс.",
  titleEnd: "Мы скажем, что имеет смысл автоматизировать.",
  description:
    "Не обязательно приходить с готовым ТЗ. Достаточно рассказать, как сейчас устроены заявки, продажи или работа с клиентами.",
  responseNote: "отвечаем в течение 1–2 рабочих дней",
};

export const footer = {
  line: "Переводим ручные B2B-процессы\nв понятные цифровые интерфейсы.",
  cta: "Разобрать задачу",
};
