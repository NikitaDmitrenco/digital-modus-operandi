import type { Service } from "./types";

/** Product directions, not stages of agency work. */
export const services: Service[] = [
  {
    number: "01",
    title: "B2B-сайты и каталоги",
    text: "Сложная номенклатура, фильтрация, разные типы продукции, формы заявок, SEO и административное управление.",
    tags: ["CATALOG", "SEO", "ADMIN"],
  },
  {
    number: "02",
    title: "Личные кабинеты",
    text: "Заказы, документы, статусы, персональные цены, история взаимодействий и повторные покупки.",
    tags: ["PORTAL", "DOCUMENTS", "PRICING"],
  },
  {
    number: "03",
    title: "CRM и внутренние системы",
    text: "Клиенты, заявки, сотрудники, логистика и операционные процессы в одном рабочем интерфейсе.",
    tags: ["CRM", "OPERATIONS", "LOGISTICS"],
  },
  {
    number: "04",
    title: "Интеграции и автоматизация",
    text: "Связываем веб-систему с CRM, ERP, складом, почтой, Telegram и другими сервисами через API.",
    tags: ["API", "ERP", "AUTOMATION"],
  },
];
