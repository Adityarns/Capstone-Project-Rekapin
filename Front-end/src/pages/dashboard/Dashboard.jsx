/** @format */

export default function Dashboard() {
  return (
    <div>
      {Array.from({ length: 50 }).map((_, i) => (
        <p key={i}>Dummy content {i}</p>
      ))}
    </div>
  );
}
