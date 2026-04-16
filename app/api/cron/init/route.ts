import "@/lib/cron";

export async function GET() {
  return new Response("Cron started");
}