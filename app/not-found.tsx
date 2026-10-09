export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="section-title">Not found</h1>
      <p className="mt-3 text-[15px] text-mute">That page is not on this machine.</p>
      <a href="/" className="btn-primary mt-8 inline-flex">
        Home
      </a>
    </div>
  );
}
