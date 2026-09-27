const STEPS = [
  { n: 1, title: 'Place your light', text: 'Tap where you are on a simple mood map, then pick the one word that fits best.' },
  { n: 2, title: 'Choose who you meet', text: 'Someone who feels close to how you do, or someone in a different headspace who can offer another view.' },
  { n: 3, title: 'Talk, anonymously', text: 'A private one-to-one chat with a random name like Warm Badger. Leave whenever you like.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="mm-how">
      <div className="mm-how__intro">
        <h2 className="mm-display mm-display--lg">Three quiet steps</h2>
        <p className="mm-body">It takes about a minute. You can stop at any point, and nothing you choose is ever shown on a profile.</p>
      </div>
      <ol className="mm-how__steps">
        {STEPS.map((s) => (
          <li key={s.n} className="mm-how__step">
            <span className="mm-how__num" aria-hidden="true">
              {s.n}
            </span>
            <h3 className="mm-how__title">{s.title}</h3>
            <p className="mm-body">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
