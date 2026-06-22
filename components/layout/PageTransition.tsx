import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="min-h-[calc(100vh-4rem)]">{children}</div>;
}
