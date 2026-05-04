import Container from "@/components/layout/Container";
import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="py-section">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="grid gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </Container>
    </main>
  );
}
