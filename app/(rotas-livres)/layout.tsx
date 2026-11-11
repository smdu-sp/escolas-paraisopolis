import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function RotasLivres({children}:{children: React.ReactNode}) {
  const session = await auth();
  // redirect() já acrescenta o basePath; mesmo destino do login bem-sucedido
  if (session) redirect('/respostas');
  return <>{children}</>;
}
