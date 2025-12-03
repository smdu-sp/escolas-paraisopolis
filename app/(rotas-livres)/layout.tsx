import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function RotasLivres({children}:{children: React.ReactNode}) {
  const session = await auth();
  console.log(session);
  if (session) redirect(process.env.NEXT_PUBLIC_BASE_PATH || '/');
  return <>{children}</>;
}