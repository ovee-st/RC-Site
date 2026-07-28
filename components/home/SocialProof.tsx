import Image from "next/image";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export type VerifiedProofItem = {
  organization: string;
  logoUrl?: string;
  result: string;
  detail: string;
};

const verifiedProof: VerifiedProofItem[] = [];

export default function SocialProof() {
  if (!verifiedProof.length) return null;

  return (
    <section className="py-12 md:py-16" aria-labelledby="customer-proof-heading">
      <Container>
        <div className="text-center">
          <Badge variant="neutral">Verified customer outcomes</Badge>
          <h2 id="customer-proof-heading" className="mt-4 text-3xl font-black text-slate-950 dark:text-white">Results shared with permission.</h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {verifiedProof.map((item) => (
            <Card key={item.organization} className="rounded-3xl p-6">
              {item.logoUrl ? <Image src={item.logoUrl} alt={`${item.organization} logo`} width={120} height={40} className="h-10 w-auto object-contain" /> : null}
              <p className="mt-5 text-xl font-black text-slate-950 dark:text-white">{item.result}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{item.organization}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
