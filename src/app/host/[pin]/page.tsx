import { HostDashboard } from "@/components/HostDashboard";

export default async function HostRoomPage({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  const { pin } = await params;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">Host Dashboard</h1>
      <HostDashboard pin={pin} />
    </div>
  );
}
