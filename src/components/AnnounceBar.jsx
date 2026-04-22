export default function AnnounceBar() {
  const messages = [
    'Free shipping on orders above ₹2,500',
    'New Drop — Latest collection live',
    'COD available across India',
    '7-day easy returns & exchanges',
  ];
  const doubled = [...messages, ...messages];
  return (
    <div className="announce" aria-label="Announcements">
      <div className="announce-track">
        {doubled.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
    </div>
  );
}
