import { notFound } from "next/navigation";
import { MDXContent } from "@content-collections/mdx/react";
import { allDocs } from "@init/mdx";

type PageProps = {
  params: Promise<{
    docSlug: string;
  }>;
};

const Page = async ({ params }: PageProps) => {
  const { docSlug } = await params;

  const currentDoc = allDocs.find((doc) => {
    const slug = doc._meta.fileName.replace(/\.mdx$/, "");
    return slug === docSlug;
  });

  if (!currentDoc) {
    return notFound();
  }

  return (
    <div>
      <h1>{currentDoc.title}</h1>
      <MDXContent code={currentDoc.mdx} />
    </div>
  );
};

export default Page;
