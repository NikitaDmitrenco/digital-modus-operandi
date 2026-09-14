import { useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Circle,
  Command,
  Instagram,
  Linkedin,
  Mail,
  Menu,
  MousePointer2,
  Plus,
  ScanLine,
  Send,
  Sparkles,
  X,
} from "lucide-react";

const navItems = [
  { label: "О нас", href: "#about" },
  { label: "Процесс", href: "#process" },
  { label: "Услуги", href: "#services" },
  { label: "Команда", href: "#team" },
  { label: "Кейсы", href: "#cases" },
  { label: "Контакты", href: "#contact" },
];

const services = [
  {
    number: "01",
    title: "Цифровая стратегия",
    text: "Разбираем бизнес по слоям: где теряются деньги, внимание и скорость. Собираем план, который можно объяснить команде.",
    tags: ["RESEARCH", "POSITIONING"],
  },
  {
    number: "02",
    title: "Продукт и интерфейс",
    text: "Проектируем цифровые продукты, в которых сложное становится понятным, а каждый экран работает на решение задачи.",
    tags: ["UX/UI", "PROTOTYPING"],
  },
  {
    number: "03",
    title: "Разработка и запуск",
    text: "Собираем рабочий digital-инструмент без разрыва между макетом и кодом. Настраиваем, измеряем, улучшаем.",
    tags: ["WEB", "NO-CODE / CODE"],
  },
  {
    number: "04",
    title: "Система роста",
    text: "После запуска остаёмся рядом: превращаем первые данные в следующие понятные шаги для бизнеса.",
    tags: ["ANALYTICS", "ITERATION"],
  },
];

const team = [
  {
    id: "D-01",
    name: "Борис",
    role: "AI / автоматизация / системы",
    bio: "Проектирует сложные digital-системы — от AI-пайплайнов и автоматизации до backend-архитектуры и интеграций.",
    skills: ["ai", "automation", "backend", "systems"],
    accent: "lime",
    portrait: "portrait-a",
  },
  {
    id: "D-02",
    name: "Никита",
    role: "Full-stack / product / e-commerce",
    bio: "Собирает цифровые продукты целиком — от интерфейса и бизнес-логики до e-commerce, SaaS и интеграций.",
    skills: ["fullstack", "product", "ecommerce", "saas"],
    accent: "ice",
    portrait: "portrait-b",
  },
  {
    id: "D-03",
    name: "Матвей",
    role: "Проджект-менеджмент / медмаркетинг",
    bio: "10 лет ведёт проекты в медицинском маркетинге. Выстраивает коммуникацию между заказчиком и командой, чтобы задачи превращались в понятный результат.",
    skills: ["project", "medmarketing", "communication"],
    accent: "violet",
    portrait: "portrait-c",
  },
  {
    id: "D-04",
    name: "Арсений",
    role: "Стратегия / контент / digital",
    bio: "3 года в digital-маркетинге. Создаёт системный контент для экспертов, предпринимателей и бизнесов — от стратегии до работающей контент-системы.",
    skills: ["content", "strategy", "digital", "business"],
    accent: "peach",
    portrait: "portrait-d",
  },
];

const cases = [
  {
    index: "001",
    client: "NORTH / property intelligence",
    title: "Из сложной аналитики — в инструмент для решений",
    result: "+38%",
    resultLabel: "к конверсии в заявку",
    meta: "Strategy · UX/UI · Web",
    tone: "case-lime",
  },
  {
    index: "002",
    client: "KADO / food retail",
    title: "Новый цифровой слой для растущей сети",
    result: "−24%",
    resultLabel: "времени до заказа",
    meta: "Product · Design system · Build",
    tone: "case-violet",
  },
  {
    index: "003",
    client: "SFERA / education",
    title: "Сайт, который объясняет ценность до первого звонка",
    result: "2.7×",
    resultLabel: "больше качественных диалогов",
    meta: "Positioning · Narrative · Motion",
    tone: "case-ice",
  },
];

const faqs = [
  ["Сколько нужно знать о digital, чтобы начать?", "Нисколько. Вы приносите бизнес-задачу и контекст, мы переводим их в понятный план действий без технического жаргона."],
  ["Вы берёте проекты только целиком?", "Нет. Можно начать с короткого стратегического спринта, аудита или прототипа. Формат зависит от того, где сейчас самая дорогая неопределённость."],
  ["Как понять, что вы подходите именно нам?", "На первом разговоре мы честно обозначаем, где можем быть полезны, а где лучше выбрать другого партнёра. Совпадение по задаче важнее красивого кейса."],
  ["Что происходит после запуска?", "Мы не исчезаем в момент релиза. Договариваемся о точке измерения, смотрим на реальные сигналы и предлагаем следующий шаг — только если он нужен."],
];

function scrollToId(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [formSent, setFormSent] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1350);
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("a, button, input, textarea, .tilt-card")) document.body.classList.add("cursor-active");
    };
    const onPointerOut = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("a, button, input, textarea, .tilt-card")) document.body.classList.remove("cursor-active");
    };
    const magneticElements = Array.from(document.querySelectorAll<HTMLElement>(".magnetic"));
    const tiltElements = Array.from(document.querySelectorAll<HTMLElement>(".tilt-card"));
    const onMagneticMove = (event: PointerEvent) => {
      const element = event.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 14;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 10;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const resetMagnetic = (event: PointerEvent) => {
      (event.currentTarget as HTMLElement).style.transform = "translate3d(0, 0, 0)";
    };
    const onTiltMove = (event: PointerEvent) => {
      const element = event.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();
      const rotateX = ((event.clientY - rect.top) / rect.height - .5) * -4;
      const rotateY = ((event.clientX - rect.left) / rect.width - .5) * 5;
      element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    };
    const resetTilt = (event: PointerEvent) => {
      (event.currentTarget as HTMLElement).style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0)";
    };
    magneticElements.forEach((element) => {
      element.addEventListener("pointermove", onMagneticMove);
      element.addEventListener("pointerleave", resetMagnetic);
    });
    tiltElements.forEach((element) => {
      element.addEventListener("pointermove", onTiltMove);
      element.addEventListener("pointerleave", resetTilt);
    });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerover", onPointerOver);
    window.addEventListener("pointerout", onPointerOut);
    return () => {
      window.clearTimeout(timer);
      revealObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointerout", onPointerOut);
      magneticElements.forEach((element) => {
        element.removeEventListener("pointermove", onMagneticMove);
        element.removeEventListener("pointerleave", resetMagnetic);
      });
      tiltElements.forEach((element) => {
        element.removeEventListener("pointermove", onTiltMove);
        element.removeEventListener("pointerleave", resetTilt);
      });
    };
  }, []);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormSent(true);
  };

  return (
    <div className="site-shell">
      <div ref={cursorRef} className="cursor-ring" aria-hidden="true"><span /></div>
      <div ref={cursorDotRef} className="cursor-dot" aria-hidden="true" />

      {loading && (
        <div className="preloader" aria-label="Загрузка">
          <div className="preloader-top"><span>DMO / SYSTEM ONLINE</span><span>2026</span></div>
          <div className="preloader-center">
            <div className="preloader-mark"><span>D</span><span>M</span><span>O</span></div>
            <div className="preloader-progress"><span /></div>
            <div className="preloader-caption">Собираем контекст <span>— пожалуйста, подождите</span></div>
          </div>
          <div className="preloader-bottom"><span>design / build / grow</span><span>000 → 100%</span></div>
        </div>
      )}

      <header className={`site-header ${menuOpen ? "is-open" : ""}`}>
        <a href="#top" className="brand" onClick={() => setMenuOpen(false)} aria-label="Digital Modus Operandi — наверх">
          <span className="brand-symbol">D</span>
          <span className="brand-name">digital<br /><b>modus operandi</b></span>
        </a>
        <div className="header-meta"><span className="status-dot" /> доступные слоты: <b>02</b></div>
        <button className="menu-trigger magnetic" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}>
          <span>{menuOpen ? "close" : "menu"}</span>
          {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
        </button>
      </header>

      <div className={`menu-overlay ${menuOpen ? "is-visible" : ""}`}>
        <div className="menu-grid-line" />
        <div className="menu-intro"><span className="mono">NAVIGATION / 00</span><p>Открываем нужный<br />контекст.</p></div>
        <nav className="overlay-nav">
          {navItems.map((item, index) => (
            <a key={item.href} href={item.href} style={{ transitionDelay: `${index * 55 + 80}ms` }} onClick={() => setMenuOpen(false)}>
              <span className="mono">0{index + 1}</span><span>{item.label}</span><ArrowUpRight size={22} strokeWidth={1.3} />
            </a>
          ))}
        </nav>
        <div className="menu-footer"><span>hello@dmo.agency</span><span>Москва / anywhere</span><span className="mono">press esc to close</span></div>
      </div>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-orbit orbit-one" aria-hidden="true" />
          <div className="hero-orbit orbit-two" aria-hidden="true" />
          <div className="hero-content">
            <div className="eyebrow reveal"><span className="section-index">// 01</span><span>Digital agency for businesses in motion</span></div>
            <h1 className="display hero-title reveal delay-1">Делаем<br /><em>сложное</em><br />понятным.</h1>
            <div className="hero-bottom reveal delay-2">
              <p className="hero-description">Стратегия, дизайн и разработка цифровых продуктов для компаний, которым мало просто «быть в интернете».</p>
              <div className="hero-actions"><a className="button button-primary magnetic" href="#contact">Обсудить задачу <ArrowUpRight size={18} /></a><a className="button button-ghost" href="#cases">Смотреть кейсы <ArrowDownRight size={18} /></a></div>
            </div>
          </div>
          <div className="hero-aside reveal delay-3"><span className="mono rotated">SCROLL TO EXPLORE</span><MousePointer2 size={16} strokeWidth={1.2} /><span className="scroll-line" /></div>
          <div className="hero-code mono reveal delay-3"><span>COORD_55.75 / 37.61</span><span>BUILD_2026.09</span><span className="code-blink">● REC</span></div>
        </section>

        <div className="marquee-strip"><div className="marquee-track"><span>strategy</span><i>✳</i><span>product design</span><i>✳</i><span>development</span><i>✳</i><span>digital growth</span><i>✳</i><span>strategy</span><i>✳</i><span>product design</span><i>✳</i><span>development</span><i>✳</i><span>digital growth</span><i>✳</i></div></div>

        <section id="about" className="problem section-pad section-dark">
          <div className="section-heading reveal"><span className="section-index">// 02</span><span className="mono">THE GAP / PROBLEM → SOLUTION</span></div>
          <div className="problem-layout">
            <div className="problem-lead reveal"><p className="kicker">Бизнес растёт быстрее,<br /><span>чем его digital.</span></p><div className="signal-mark"><span /><span /><span /><span /><span /></div></div>
            <div className="problem-copy reveal delay-1"><p>Сайт не объясняет ценность. Команда работает в разных направлениях. Потенциальные клиенты уходят, не поняв, почему им стоит выбрать вас.</p><p>Мы находим точку разрыва и закрываем её — от первой мысли до работающего продукта.</p></div>
          </div>
          <div className="outcome-grid reveal delay-2">
            <div className="outcome-card"><span className="mono">01 / SEE CLEARLY</span><strong>Ясность</strong><p>Понимаете, что именно делать и зачем.</p><ArrowUpRight size={18} /></div>
            <div className="outcome-card outcome-card-accent"><span className="mono">02 / MOVE FASTER</span><strong>Скорость</strong><p>Меньше согласований. Больше движения.</p><ArrowUpRight size={18} /></div>
            <div className="outcome-card"><span className="mono">03 / GROW SMARTER</span><strong>Результат</strong><p>Digital начинает работать на бизнес.</p><ArrowUpRight size={18} /></div>
          </div>
        </section>

        <section id="process" className="process section-pad">
          <div className="section-heading reveal"><span className="section-index">// 03</span><span className="mono">HOW WE WORK / PROCESS</span><span className="heading-note">4 шага · 1 команда · 0 лишнего</span></div>
          <div className="process-intro reveal"><h2 className="display">Двигаемся<br /><em>по делу.</em></h2><p>Каждый этап заканчивается артефактом, который можно проверить, обсудить и использовать дальше. Вы всегда знаете, где мы и что нужно от вас.</p></div>
          <div className="process-list">
            {["Собираем контекст", "Находим точку роста", "Собираем решение", "Запускаем и измеряем"].map((item, index) => (
              <div className="process-row reveal" key={item}>
                <span className="process-number mono">0{index + 1}</span><div className="process-main"><h3>{item}</h3><p>{["Разбираемся в бизнесе, аудитории и реальных ограничениях. Не начинаем с шаблона.", "Формулируем, какую задачу решаем первой, чтобы не распыляться на всё сразу.", "Прототипируем, тестируем, спорим и приводим идею к форме, которая выдержит реальность.", "Выходим в мир, смотрим на сигналы и решаем, что улучшать дальше — если есть смысл."][index]}</p></div><div className="process-client"><span className="mono">ВАШ ВКЛАД</span><p>{["60 мин разговора + доступ к фактам", "Честная обратная связь", "Решение на ключевых точках", "Доверие данным и диалогу"][index]}</p></div><ArrowUpRight className="process-arrow" size={23} strokeWidth={1.2} />
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="services section-pad section-dark">
          <div className="section-heading reveal"><span className="section-index">// 04</span><span className="mono">CAPABILITIES / SERVICES</span><span className="heading-note">не продаём часы</span></div>
          <div className="services-header reveal"><h2 className="display">Собираем<br /><em>системы.</em></h2><p>Не набор разрозненных услуг, а связка, которая отвечает на задачу целиком.</p></div>
          <div className="services-grid">{services.map((service, index) => <article className={`service-card tilt-card reveal delay-${Math.min(index + 1, 3)}`} key={service.number}><div className="service-top"><span className="mono">SERVICE_{service.number}</span><ArrowUpRight size={19} strokeWidth={1.2} /></div><div className="service-number">{service.number}</div><h3>{service.title}</h3><p>{service.text}</p><div className="tag-row">{service.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></article>)}</div>
        </section>

        <section id="team" className="team section-pad">
          <div className="section-heading reveal"><span className="section-index">// 05</span><span className="mono">THE PEOPLE / TEAM DOSSIERS</span><span className="heading-note">4 × human intelligence</span></div>
          <div className="team-header reveal"><h2 className="display">Четыре<br /><em>оптики.</em></h2><p>Маленькая команда — не маленький масштаб. Мы работаем рядом с вами, поэтому каждый участник знает контекст и влияет на результат.</p></div>
          <div className="team-grid">{team.map((person, index) => <article className={`person-card tilt-card reveal delay-${Math.min(index + 1, 3)}`} key={person.id}><div className={`portrait ${person.portrait} ${person.id === "D-03" || person.id === "D-04" ? "portrait-has-image" : ""}`}>{person.id === "D-03" ? <img className="portrait-image" src="/manus-storage/photo_2025-11-23_15-38-27_a7dba5f0.jpg" alt="Матвей" /> : person.id === "D-04" ? <img className="portrait-image" src="/manus-storage/photo_2026-09-14_11-36-15_fdc3c0c0.jpg" alt="Арсений" /> : <><span className="portrait-placeholder mono">PHOTO / PLACEHOLDER</span><span className="portrait-scan"><ScanLine size={16} /></span><span className="portrait-id mono">{person.id}</span></>}</div><div className="person-meta"><div><h3>{person.name}</h3><p>{person.role}</p></div><ArrowUpRight size={19} strokeWidth={1.2} /></div><p className="person-bio">{person.bio}</p><div className="person-tags">{person.skills.map((skill) => <span key={skill}>#{skill}</span>)}</div></article>)}</div>
        </section>

        <section id="cases" className="cases section-pad section-dark">
          <div className="section-heading reveal"><span className="section-index">// 06</span><span className="mono">SELECTED WORK / CASES</span><span className="heading-note">placeholder projects</span></div>
          <div className="cases-header reveal"><h2 className="display">Говорят<br /><em>цифры.</em></h2><a className="text-link" href="#contact">Все кейсы в работе <ArrowUpRight size={17} /></a></div>
          <div className="cases-list">{cases.map((item, index) => <article className={`case-card ${item.tone} reveal delay-${Math.min(index + 1, 3)}`} key={item.index}><div className="case-visual"><div className="case-grid" /><div className="case-orb" /><div className="case-label mono">CASE_{item.index}</div><div className="case-arrow"><ArrowUpRight size={22} strokeWidth={1.2} /></div></div><div className="case-details"><div><span className="mono case-client">{item.client}</span><h3>{item.title}</h3><span className="case-meta">{item.meta}</span></div><div className="case-result"><strong>{item.result}</strong><span>{item.resultLabel}</span></div></div></article>)}</div>
        </section>

        <section id="why" className="why section-pad">
          <div className="section-heading reveal"><span className="section-index">// 07</span><span className="mono">WHY DMO / DIFFERENCE</span></div>
          <div className="why-layout"><div className="why-title reveal"><span className="mono">NOT FOR EVERYONE</span><h2 className="display">Меньше<br /><em>шума.</em><br />Больше смысла.</h2></div><div className="difference-list">{["Начинаем с вопроса, а не с красивого решения.", "Говорим на языке бизнеса, не технологий.", "Не прячем процесс за статусами и звонками.", "Оставляем после себя систему, а не зависимость.", "Собираем ровно столько, сколько нужно задаче."] .map((text, index) => <div className="difference-item reveal" key={text}><span className="difference-index mono">0{index + 1}</span><p>{text}</p><Check size={17} /></div>)}</div></div>
        </section>

        <section id="faq" className="faq section-pad section-dark">
          <div className="section-heading reveal"><span className="section-index">// 08</span><span className="mono">NO SMALL QUESTIONS / FAQ</span></div>
          <div className="faq-layout"><div className="faq-title reveal"><h2 className="display">Спросить<br /><em>напрямую.</em></h2><p>Если здесь нет ответа — <a href="#contact">напишите нам</a>. Разберёмся вместе.</p></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item reveal ${activeFaq === index ? "is-active" : ""}`} key={question}><button onClick={() => setActiveFaq(activeFaq === index ? null : index)} aria-expanded={activeFaq === index}><span className="mono">0{index + 1}</span><strong>{question}</strong><Plus size={20} /></button><div className="faq-answer"><p>{answer}</p></div></div>)}</div></div>
        </section>

        <section id="contact" className="contact section-pad">
          <div className="contact-signal" aria-hidden="true"><div className="signal-ring ring-a" /><div className="signal-ring ring-b" /><div className="signal-core"><Command size={25} strokeWidth={1.1} /></div></div>
          <div className="section-heading reveal"><span className="section-index">// 09</span><span className="mono">OPEN CHANNEL / CONTACT</span><span className="heading-note">ответим в течение 1–2 дней</span></div>
          <div className="contact-layout"><div className="contact-title reveal"><h2 className="display">Есть<br /><em>задача?</em></h2><p>Расскажите, что происходит. Без презентации и правильных слов — достаточно контекста.</p><div className="contact-links"><a href="mailto:hello@dmo.agency"><Mail size={17} /> hello@dmo.agency</a><a href="#contact"><Send size={17} /> Telegram / @dmo_agency</a></div></div><form className="contact-form reveal delay-1" onSubmit={handleFormSubmit}><label><span className="mono">01 / КАК ВАС ЗОВУТ</span><input required name="name" placeholder="Имя и компания" /></label><label><span className="mono">02 / КУДА ОТВЕТИТЬ</span><input required type="email" name="email" placeholder="you@company.ru" /></label><label><span className="mono">03 / ЧТО ПРОИСХОДИТ</span><textarea required name="brief" placeholder="Пара слов о задаче, сроках или сомнениях" rows={3} /></label><button className="button button-primary magnetic" type="submit">{formSent ? <>Сообщение принято <Check size={18} /></> : <>Отправить контекст <ArrowUpRight size={18} /></>}</button>{formSent && <p className="form-success"><Circle size={8} fill="currentColor" /> Спасибо. Это прототип — форма никуда не отправляет данные.</p>}</form></div>
        </section>
      </main>

      <footer className="site-footer section-pad"><div className="footer-main"><a href="#top" className="brand"><span className="brand-symbol">D</span><span className="brand-name">digital<br /><b>modus operandi</b></span></a><p>Digital-партнёр для тех,<br />кто движется всерьёз.</p><a className="footer-cta" href="#contact">Начать разговор <ArrowUpRight size={18} /></a></div><div className="footer-bottom"><span>© 2026 Digital Modus Operandi</span><span className="mono">DESIGN REFERENCE / PLACEHOLDER CONTENT</span><div className="socials"><a href="#contact" aria-label="Instagram"><Instagram size={16} /></a><a href="#contact" aria-label="LinkedIn"><Linkedin size={16} /></a><a href="mailto:hello@dmo.agency" aria-label="Email"><Mail size={16} /></a></div></div></footer>
    </div>
  );
}
