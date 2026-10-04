interface SignupHighlightsProps {
  capabilities: { heading: string; items: readonly string[] };
  faq: {
    heading: string;
    items: readonly { question: string; answer: string }[];
  };
}

export const SIGNUP_FAQ_ITEM_COUNT = 5;

export function SignupHighlights({ capabilities, faq }: SignupHighlightsProps) {
  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text">{capabilities.heading}</h2>
        <ul className="flex flex-col gap-2">
          {capabilities.items.map((item) => (
            <li key={item} className="text-base leading-relaxed text-text-muted">
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text">{faq.heading}</h2>
        <div className="flex flex-col gap-6">
          {faq.items.slice(0, SIGNUP_FAQ_ITEM_COUNT).map((item) => (
            <div key={item.question} className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-text">{item.question}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
