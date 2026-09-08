import { LANDING_FAQ } from './landingFaq';

export function LandingFaq() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text">Често задавани въпроси</h2>
      <div className="flex flex-col gap-6">
        {LANDING_FAQ.map((item) => (
          <div key={item.question} className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-text">{item.question}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
