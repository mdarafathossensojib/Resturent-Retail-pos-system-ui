
import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoaderCircle
          className="h-10 w-10 animate-spin text-primary"
          aria-hidden="true"
        />

        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            Loading...
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please wait while we prepare your page.
          </p>
        </div>
      </div>
    </div>
  );
}
