export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const videoUrl = process.env.NEXT_PUBLIC_LOGIN_VIDEO_URL;
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black p-4 overflow-hidden">
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src={videoUrl} />
        </video>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black pointer-events-none" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
