import { Meteors } from "@/app/(marketing)/_components/meteor";
import { WaitlistForm } from "@/app/(marketing)/_components/waitlist-form";

const Page = () => {
  return (
    <>
      <section>
        <div className="border-border relative mx-auto max-w-7xl border-x border-b p-8 lg:py-32">
          <div className="max-w-2xl">
            <span className="text-muted-foreground font-light">
              Accelerate building modern applications
            </span>
            <h1 className="text-secondary-foreground mt-6 text-2xl font-light text-pretty">
              An AI native starter kit to build, launch, and scale your next project.
            </h1>
            <WaitlistForm />
          </div>
          <Meteors />
        </div>
      </section>
      <section>
        <div className="border-border mx-auto max-w-7xl border-x border-b">
          <div className="divide-gray text-secondary-foreground grid grid-cols-1 md:grid-cols-3 md:divide-x">
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Build</div>
              <p className="text-muted-foreground">
                Start with a comprehensive foundation that includes authentication, database setup,
                UI components, and AI integrations. Skip the boilerplate and focus on what makes
                your application unique.
              </p>
            </div>
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Launch</div>
              <p className="text-muted-foreground">
                Deploy with confidence using built-in CI/CD pipelines, monitoring, and performance
                optimization. Get your MVP to market faster with production-ready infrastructure and
                best practices.
              </p>
            </div>
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Scale</div>
              <p className="text-muted-foreground">
                Built for growth with scalable architecture, caching strategies, and modular
                components. Easily extend functionality and handle increasing user demands without
                architectural rewrites.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Page;
