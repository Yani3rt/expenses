export default function AnimatedText({ as: Element, children, staggerOffset = 0 }) {
  const text = String(children);

  return (
    <Element className="donut-center-text" aria-label={text}>
      {Array.from(text).map((character, index) => (
        <span
          className="donut-center-character"
          aria-hidden="true"
          key={`${character}-${index}`}
          style={{ "--character-index": staggerOffset + index }}
        >
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </Element>
  );
}
