import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";

export default function PageContainer({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <main>
      <Section>
        <Container className={className} {...props} />
      </Section>
    </main>
  );
}
