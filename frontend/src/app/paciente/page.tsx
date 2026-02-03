import { redirect } from "next/navigation";

export default function Page() {
  redirect("/paciente/dashboard");
  return null;
}
