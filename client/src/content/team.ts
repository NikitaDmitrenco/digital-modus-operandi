import type { TeamMember } from "./types";

export const teamIntro = {
  titleStart: "Четыре",
  titleAccent: "оптики.",
  text: "Небольшая команда без передачи проекта через пять уровней менеджмента. Люди, с которыми вы обсуждаете задачу, участвуют и в её реализации.",
  note: "4 × human intelligence",
};

/**
 * Roles are described through value for the project, not through a CV.
 * Boris and Arseniy: texts confirmed by the client.
 * Nikita and Matvey: reformulated from the copy already in the repository,
 * pending client confirmation (see DMO_REWORK_PROGRESS.md §4).
 */
export const team: TeamMember[] = [
  {
    id: "D-01",
    name: "Борис",
    role: "AI / SYSTEMS / AUTOMATION",
    bio: "Отвечает за AI-интеграции, автоматизацию процессов и разработку внутренних web-систем.",
    skills: ["ai", "automation", "backend", "integrations"],
    portrait: "portrait-a",
  },
  {
    id: "D-02",
    name: "Никита",
    role: "FULL-STACK / PRODUCT / E-COMMERCE",
    bio: "Собирает веб-системы целиком — интерфейс, бизнес-логику, админку и интеграции — и отвечает за то, чтобы продукт работал в реальной эксплуатации.",
    skills: ["fullstack", "product", "ecommerce", "saas"],
    portrait: "portrait-b",
    image: "/team/nikita.jpg",
    imageAlt: "Никита — full-stack разработчик DMO",
  },
  {
    id: "D-04",
    name: "Арсений",
    role: "FOUNDER / SALES / CLIENT ACQUISITION",
    bio: "Основатель DMO. Отвечает за продажи, поиск и привлечение клиентов, развитие партнёрств и первичную коммуникацию с заказчиком.",
    skills: ["founder", "sales", "partnerships"],
    portrait: "portrait-d",
    image: "/team/arseniy.png",
    imageAlt: "Арсений — основатель DMO",
  },
  {
    id: "D-03",
    name: "Матвей",
    role: "PROJECT MANAGEMENT / PROCESS / COMMUNICATION",
    bio: "10 лет ведёт проекты. Отвечает за то, чтобы договорённости с заказчиком превращались в план работ, сроки и понятный результат.",
    skills: ["project", "process", "communication"],
    portrait: "portrait-c",
    image: "/team/matvey.jpg",
    imageAlt: "Матвей — проджект-менеджер DMO",
  },
];
