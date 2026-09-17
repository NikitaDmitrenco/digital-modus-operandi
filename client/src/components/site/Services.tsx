import { ArrowUpRight } from "lucide-react";
import { track } from "@/lib/analytics";
import { services } from "@/content/services";

export default function Services() {
  return (
    <section
      id="services"
      className="services section-pad"
      aria-labelledby="services-title"
    >
      <div className="section-heading reveal">
        <span className="section-index">// 03</span>
        <span className="mono">ЧТО РАЗРАБАТЫВАЕМ / PRODUCTS</span>
        <span className="heading-note">продукты, а не часы</span>
      </div>
      <div className="services-header reveal">
        <h2 className="display" id="services-title">
          Собираем
          <br />
          <em>системы.</em>
        </h2>
        <p>
          Четыре типа решений, которые снимают ручную работу с менеджеров и
          делают процесс видимым для клиента.
        </p>
      </div>
      <div className="services-grid">
        {services.map((service, index) => (
          <article
            className={`service-card tilt-card reveal delay-${Math.min(index + 1, 3)}`}
            key={service.number}
            onMouseEnter={() =>
              track("service_open", {
                section: "services",
                source: service.title,
              })
            }
          >
            <div className="service-top">
              <span className="mono">SERVICE_{service.number}</span>
              <ArrowUpRight size={19} strokeWidth={1.2} aria-hidden="true" />
            </div>
            <div className="service-number" aria-hidden="true">
              {service.number}
            </div>
            <h3>{service.title}</h3>
            <p>{service.text}</p>
            <div className="tag-row">
              {service.tags.map(tag => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
